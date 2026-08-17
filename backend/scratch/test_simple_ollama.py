import httpx
import time

def test_speed():
    url = "http://16.113.91.178:11434/api/generate"
    payload = {
        "model": "qwen2.5:7b",
        "prompt": "Score this startup from 0 to 100 in JSON format: {\"score\": 85, \"verdict\": \"good\"}",
        "format": "json",
        "stream": False,
        "options": {
            "num_predict": 100
        }
    }
    print("Sending short prompt to EC2 Ollama...", flush=True)
    t0 = time.time()
    with httpx.Client(timeout=60.0) as client:
        resp = client.post(url, json=payload)
        t1 = time.time()
        print(f"Status: {resp.status_code} in {t1 - t0:.2f}s", flush=True)
        print(f"Response: {resp.text}", flush=True)

if __name__ == "__main__":
    test_speed()
