import asyncio
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ai_scorer import evaluate_startup_with_llm
from core.config import settings

def test_ai_scoring():
    print("=" * 80, flush=True)
    print("🧠 Testing Remote EC2 Ollama Qwen2.5:7b AI Deal Scoring directly...", flush=True)
    print(f"📍 Model: {settings.OLLAMA_MODEL} @ {settings.OLLAMA_BASE_URL}", flush=True)
    print("=" * 80, flush=True)
    
    sample_startup = {
        "id": "test-123",
        "name": "Foundry Cloud AI",
        "tagline": "Autonomous multi-agent platform for real-time market deals",
        "description": "Foundry Cloud connects early stage founders directly to verified venture capital partners with automated market scraping, AI deal evaluation, and data room diligence vaults.",
        "domains": ["AI", "Venture Capital", "Fintech", "SaaS"],
        "stage": "seed",
        "ask_amount": 750000.0,
        "equity_offered": 8.0,
        "implied_valuation": 9375000.0,
        "use_of_funds": "Engineering team expansion and enterprise pilot rollout",
        "mrr": 22000.0,
        "growth_rate_pct": 32.0,
        "burn_rate": 12000.0,
        "runway_months": 24,
        "gross_margin_pct": 84.0,
        "total_raised": 250000.0,
        "moat_description": "Proprietary real-time market deal intelligence graph and distributed event streaming engine.",
        "team_info": "CEO: Former VP Engineering at SeedFund. CTO: Ex-Google Brain AI researcher.",
        "deck_extracted_text": "Slide 1: Problem - Traditional VC deal evaluation takes 6 weeks. Slide 2: Solution - Instant multi-parameter deal scoring and live DDGS market verification. Slide 3: Traction - 120+ active founders, $22k MRR growing 32% MoM.",
    }
    
    sample_market_info = {
        "scraped_context": "Foundry AI provides continuous deal screening and verified syndicate matching for top venture funds.",
        "competitors_found": ["AngelList", "PitchBook", "Dealroom", "Crunchbase"],
        "detected_tech_stack": ["Next.js", "FastAPI", "PostgreSQL", "Apache Kafka", "Docker"],
        "market_size_estimate": "$38 Billion Global Venture Intelligence Market",
        "growth_signals": ["High VC automation adoption", "Strong ARR expansion in private market data"],
    }
    
    print("\n⏳ Sending deal prompt to Remote EC2 Ollama instance...", flush=True)
    result = evaluate_startup_with_llm(sample_startup, sample_market_info, allow_fallback=False)
    
    print("\n" + "=" * 80, flush=True)
    print(f"🏆 OVERALL SCORE: {result['overall_score']} / 100", flush=True)
    print("📊 RUBRIC CATEGORIES:", flush=True)
    for k, v in result.get("category_scores", {}).items():
        print(f"   - {k.replace('_', ' ').title()}: {v} pts", flush=True)
    print(f"\n📝 VERDICT: {result['verdict']}", flush=True)
    print(f"\n🟢 KEY PROS: {result.get('key_pros')}", flush=True)
    print(f"\n🔴 KEY CONS: {result.get('key_cons')}", flush=True)
    print(f"\n🎯 MARKET RADAR: {result.get('market_radar')}", flush=True)
    print("=" * 80, flush=True)
    print("✨ TEST PASSED: Genuine Remote EC2 Ollama Qwen2.5:7b AI scoring verified!", flush=True)

if __name__ == "__main__":
    test_ai_scoring()
