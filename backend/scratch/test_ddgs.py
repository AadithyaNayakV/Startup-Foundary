import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.scraper import fetch_ddgs_top_results, construct_search_query

def test_ddgs():
    query = construct_search_query("Foundry AI", ["AI", "Fintech"], "Startup investment platform")
    print(f"Executing DDGS search for query: '{query}'...", flush=True)
    results = fetch_ddgs_top_results(query, max_results=5)
    print(f"Results returned: {len(results)}", flush=True)
    for idx, r in enumerate(results, 1):
        print(f"  {idx}. [{r.get('title')}] - {r.get('href')}", flush=True)
        print(f"     Body: {r.get('body')[:100]}...", flush=True)
    print("DDGS test completed successfully!", flush=True)

if __name__ == "__main__":
    test_ddgs()
