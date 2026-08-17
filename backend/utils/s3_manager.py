import logging
import io
import re
from typing import Optional
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from core.config import settings

logger = logging.getLogger("foundry.utils.s3_manager")


class S3Manager:
    """
    AWS S3 Cloud Storage Manager for startup pitch decks and documents.
    Handles secure authentication, PDF uploads, and binary stream retrieval.
    """

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        region: Optional[str] = None,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
    ):
        self.bucket_name = bucket_name or getattr(settings, "AWS_S3_BUCKET_NAME", "startup-foundary-pitch-decks")
        self.region = region or getattr(settings, "AWS_REGION", "us-east-1")
        self.aws_access_key_id = aws_access_key_id or getattr(settings, "AWS_ACCESS_KEY_ID", "")
        self.aws_secret_access_key = aws_secret_access_key or getattr(settings, "AWS_SECRET_ACCESS_KEY", "")
        self._client = None

    @property
    def client(self):
        """Lazy initializer for boto3 S3 client."""
        if self._client is None:
            client_kwargs = {"region_name": self.region}
            if self.aws_access_key_id and self.aws_secret_access_key:
                client_kwargs["aws_access_key_id"] = self.aws_access_key_id
                client_kwargs["aws_secret_access_key"] = self.aws_secret_access_key
            self._client = boto3.client("s3", **client_kwargs)
        return self._client

    def extract_s3_key(self, s3_key_or_url: str) -> str:
        """
        Extracts the pure S3 object key from either a raw key or full S3 URL.
        Example: 'https://bucket.s3.region.amazonaws.com/pitch_decks/123/pitch_deck.pdf' -> 'pitch_decks/123/pitch_deck.pdf'
        """
        if not s3_key_or_url:
            return ""
        if s3_key_or_url.startswith("http://") or s3_key_or_url.startswith("https://"):
            # Match standard AWS S3 URL pattern
            match = re.search(r"amazonaws\.com/(.+)$", s3_key_or_url)
            if match:
                return match.group(1).split("?")[0]
            # Match path-style or custom domain URL
            parts = s3_key_or_url.split("?")[0].split("/")
            return "/".join(parts[3:])
        return s3_key_or_url.lstrip("/")

    def upload_file(self, file_bytes: bytes, s3_key: str, content_type: Optional[str] = None) -> str:
        """
        Uploads binary file data (logos, pitch decks, data room docs) directly to AWS S3.
        Returns the public S3 URL: https://{bucket}.s3.{region}.amazonaws.com/{s3_key}
        """
        clean_key = s3_key.lstrip("/")
        if not content_type:
            import mimetypes
            content_type, _ = mimetypes.guess_type(clean_key)
            if not content_type:
                content_type = "application/octet-stream"

        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=clean_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            s3_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{clean_key}"
            logger.info(f"✅ Successfully uploaded file to AWS S3: {s3_url} ({len(file_bytes)} bytes, {content_type})")
            return s3_url
        except (ClientError, BotoCoreError) as e:
            logger.error(f"❌ AWS S3 ClientError during upload to key '{clean_key}': {e}")
            raise e
        except Exception as e:
            logger.error(f"❌ Unexpected error during S3 upload to key '{clean_key}': {e}")
            raise e

    def upload_pdf(self, file_bytes: bytes, s3_key: str) -> str:
        """Uploads PDF to S3."""
        return self.upload_file(file_bytes, s3_key, content_type="application/pdf")

    def get_file_bytes(self, s3_key_or_url: str) -> bytes:
        """
        Fetches raw file bytes from AWS S3.
        Accepts either an S3 key or full S3 URL.
        """
        clean_key = self.extract_s3_key(s3_key_or_url)
        if not clean_key:
            raise ValueError(f"Invalid S3 key or URL: '{s3_key_or_url}'")

        try:
            response = self.client.get_object(
                Bucket=self.bucket_name,
                Key=clean_key,
            )
            body_bytes = response["Body"].read()
            logger.info(f"✅ Retrieved {len(body_bytes)} bytes from AWS S3 key: '{clean_key}'")
            return body_bytes
        except (ClientError, BotoCoreError) as e:
            logger.error(f"❌ AWS S3 ClientError fetching key '{clean_key}': {e}")
            raise e
        except Exception as e:
            logger.error(f"❌ Unexpected error fetching S3 key '{clean_key}': {e}")
            raise e

    def get_pdf_bytes(self, s3_key_or_url: str) -> bytes:
        """Alias for get_file_bytes."""
        return self.get_file_bytes(s3_key_or_url)

    def generate_presigned_url(
        self,
        s3_key_or_url: str,
        expires_in: int = 3600,
        filename: Optional[str] = None,
        inline: bool = True,
    ) -> str:
        """
        Generates a secure, time-limited AWS S3 pre-signed GET URL for accessing private objects.
        Valid for `expires_in` seconds (default 3600s / 1 hour).
        Supports browser inline viewing (e.g. PDF view in new tab) or download attachments.
        """
        clean_key = self.extract_s3_key(s3_key_or_url)
        if not clean_key:
            raise ValueError(f"Invalid S3 key or URL: '{s3_key_or_url}'")

        params = {
            "Bucket": self.bucket_name,
            "Key": clean_key,
        }

        # Configure Content-Disposition header for browser PDF viewing vs direct attachment download
        disposition_type = "inline" if inline else "attachment"
        if filename:
            safe_filename = filename.replace('"', '\\"')
            params["ResponseContentDisposition"] = f'{disposition_type}; filename="{safe_filename}"'
        else:
            params["ResponseContentDisposition"] = disposition_type

        # Guess MIME type for proper browser rendering
        import mimetypes
        content_type, _ = mimetypes.guess_type(clean_key)
        if content_type:
            params["ResponseContentType"] = content_type

        try:
            presigned_url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=expires_in,
            )
            logger.info(f"🔑 Generated AWS S3 pre-signed URL for '{clean_key}' (valid for {expires_in}s, {disposition_type})")
            return presigned_url
        except (ClientError, BotoCoreError) as e:
            logger.error(f"❌ AWS S3 ClientError generating pre-signed URL for '{clean_key}': {e}")
            raise e
        except Exception as e:
            logger.error(f"❌ Unexpected error generating pre-signed URL for '{clean_key}': {e}")
            raise e

    def delete_file(self, s3_key_or_url: str) -> bool:
        """
        Deletes an object from AWS S3.
        Accepts either an S3 key or full S3 URL.
        """
        clean_key = self.extract_s3_key(s3_key_or_url)
        if not clean_key:
            return False

        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=clean_key,
            )
            logger.info(f"✅ Successfully deleted AWS S3 object: '{clean_key}'")
            return True
        except (ClientError, BotoCoreError) as e:
            logger.error(f"❌ AWS S3 ClientError deleting key '{clean_key}': {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error deleting S3 key '{clean_key}': {e}")
            return False


# Singleton instance
s3_manager = S3Manager()
