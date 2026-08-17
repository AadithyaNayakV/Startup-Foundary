import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from utils.s3_manager import s3_manager

def test_s3():
    print("[S3 Test] Checking S3 Configuration...")
    print(f"  Bucket: {s3_manager.bucket_name}")
    print(f"  Region: {s3_manager.region}")
    
    test_content = b"Hello Foundry AWS S3 Cloud Storage test!"
    test_key = "tests/test_s3_connection.txt"
    
    print(f"[S3 Test] Uploading {len(test_content)} bytes to {test_key}...")
    try:
        url = s3_manager.upload_file(test_content, test_key, content_type="text/plain")
        print(f"[SUCCESS] Uploaded successfully: {url}")
        
        print("[S3 Test] Downloading file back...")
        fetched = s3_manager.get_file_bytes(test_key)
        assert fetched == test_content, "Downloaded content mismatch!"
        print(f"[SUCCESS] Verified downloaded content matches ({len(fetched)} bytes)")
        
        print("[S3 Test] Deleting test object...")
        deleted = s3_manager.delete_file(test_key)
        print(f"[SUCCESS] Deleted object: {deleted}")
        print("[SUCCESS] All AWS S3 tests passed!")
    except Exception as e:
        print(f"[ERROR] AWS S3 Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_s3()
