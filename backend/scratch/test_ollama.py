import httpx
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.config import settings

def test_ollama():
    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags"
    print(f"Connecting to Ollama at {url}...")
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(url)
            print(f"Status Code: {res.status_code}")
            print(f"Models available: {res.json()}")
    except Exception as e:
        print(f"Connection Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_ollama()
