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

    def upload_pdf(self, file_bytes: bytes, s3_key: str) -> str:
        """
        Uploads binary PDF data directly to AWS S3 with ContentType='application/pdf'.
        Returns the public S3 URL: https://{bucket}.s3.{region}.amazonaws.com/{s3_key}
        """
        clean_key = s3_key.lstrip("/")
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=clean_key,
                Body=file_bytes,
                ContentType="application/pdf",
            )
            s3_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{clean_key}"
            logger.info(f"✅ Successfully uploaded PDF to AWS S3: {s3_url} ({len(file_bytes)} bytes)")
            return s3_url
        except (ClientError, BotoCoreError) as e:
            logger.error(f"❌ AWS S3 ClientError during upload to key '{clean_key}': {e}")
            raise e
        except Exception as e:
            logger.error(f"❌ Unexpected error during S3 upload to key '{clean_key}': {e}")
            raise e

    def get_pdf_bytes(self, s3_key_or_url: str) -> bytes:
        """
        Fetches the raw PDF bytes from AWS S3 for background processing.
        Accepts either an S3 key ('pitch_decks/.../pitch_deck.pdf') or a full S3 URL.
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
            logger.info(f"✅ Retrieved {len(body_bytes)} PDF bytes from AWS S3 key: '{clean_key}'")
            return body_bytes
        except (ClientError, BotoCoreError) as e:
            logger.error(f"❌ AWS S3 ClientError fetching key '{clean_key}': {e}")
            raise e
        except Exception as e:
            logger.error(f"❌ Unexpected error fetching S3 key '{clean_key}': {e}")
            raise e


# Singleton instance
s3_manager = S3Manager()
