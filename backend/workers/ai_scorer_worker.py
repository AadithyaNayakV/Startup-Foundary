import asyncio
import sys
import os

# Add parent directory to sys.path for standalone script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from workers.ai_scoring_worker import run_worker, handle_ai_scoring

if __name__ == "__main__":
    asyncio.run(run_worker())
