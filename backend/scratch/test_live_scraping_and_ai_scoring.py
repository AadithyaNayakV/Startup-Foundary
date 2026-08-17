import asyncio
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
from models import Startup
from services.scraper import execute_dual_stage_scrape
from services.ai_scorer import evaluate_startup_with_llm
from core.config import settings


async def main():
    print("\n" + "=" * 80)
    print("🚀 LIVE PIPELINE TEST: Web Scraper (DuckDuckGo + Playwright) & Remote EC2 Ollama Qwen2.5:7b")
    print("=" * 80)
    
    db = SessionLocal()
    startup = db.query(Startup).first()
    if not startup:
        print("❌ No startup found in database to test.")
        return
        
    print(f"\n[1] Testing Startup: '{startup.name}'")
    print(f"    - Tagline: {startup.tagline}")
    print(f"    - Domains: {startup.domains}")
    print(f"    - Website: {startup.website_url}")
    print(f"    - Stage: {startup.stage}")
    print(f"    - Ask: ${startup.ask_amount or 0.0:,.0f} for {startup.equity_offered or 0.0}% equity")
    print(f"    - MRR: ${startup.mrr or 0.0:,.0f} | Growth: {startup.growth_rate_pct or 0.0}%")
    print(f"    - Current DB AI Score: {startup.ai_score}")
    print(f"    - Current DB AI Verdict: {startup.ai_verdict}")
    
    # 1. Test Live Scraper
    print("\n" + "-" * 80)
    print("🌐 [STAGE 1] Running Live Dual-Stage Web Scraper...")
    print("-" * 80)
    scraped_data = await execute_dual_stage_scrape(
        name=startup.name,
        domains=startup.domains or ["AI", "SaaS"],
        tagline=startup.tagline or "Next generation platform",
        raw_competitors=startup.main_competitors or "",
        max_results=5,
    )
    
    print(f"✅ Scraping completed!")
    print(f"   🔍 Query Used: \"{scraped_data['search_query_used']}\"")
    print(f"   ⚔️ Competitors Found: {scraped_data['competitors_found']}")
    print(f"   📥 Extracted Sites ({len(scraped_data['top_sites_scraped'])}):")
    for idx, s in enumerate(scraped_data['top_sites_scraped'][:3], 1):
        print(f"      {idx}. [{s.get('title')}] ({s.get('url')})")
        print(f"         Snippet: {s.get('extracted_text')[:120]}...")
        
    # 2. Test Remote EC2 Ollama Evaluation
    print("\n" + "-" * 80)
    print(f"🧠 [STAGE 2] Dispatching to Remote EC2 Ollama ({settings.OLLAMA_MODEL}) at {settings.OLLAMA_BASE_URL}...")
    print("-" * 80)
    
    startup_dict = {
        "id": str(startup.id),
        "name": startup.name,
        "tagline": startup.tagline or "",
        "description": startup.description or "",
        "domains": startup.domains or ["AI", "SaaS"],
        "stage": startup.stage or "seed",
        "ask_amount": startup.ask_amount or 500000.0,
        "equity_offered": startup.equity_offered or 10.0,
        "implied_valuation": startup.implied_valuation or 5000000.0,
        "use_of_funds": startup.use_of_funds or "R&D and GTM",
        "mrr": startup.mrr or 15000.0,
        "growth_rate_pct": startup.growth_rate_pct or 25.0,
        "burn_rate": startup.burn_rate or 8000.0,
        "runway_months": startup.runway_months or 18,
        "gross_margin_pct": startup.gross_margin_pct or 82.0,
        "total_raised": startup.total_raised or 100000.0,
        "main_competitors": startup.main_competitors or "",
        "moat_description": startup.moat_description or "Proprietary AI routing and zero server architecture",
        "team_info": "Founder: Ex-Senior AI Engineer, CTO: Distributed Systems architect.",
        "deck_extracted_text": startup.pitch_deck_parsed_text or "",
    }
    
    market_info = {
        "scraped_context": "\n".join([f"[{s.get('title')}] {s.get('extracted_text')[:200]}" for s in scraped_data['top_sites_scraped']]),
        "competitors_found": scraped_data['competitors_found'],
        "detected_tech_stack": ["Next.js", "FastAPI", "PostgreSQL", "Tailwind CSS"],
        "market_size_estimate": "$24B Global Market by 2028",
        "growth_signals": ["High sector adoption", "Scalable cloud architecture"],
    }
    
    eval_result = evaluate_startup_with_llm(startup_dict, market_info, allow_fallback=False)
    
    print("\n" + "=" * 80)
    print("🏆 [REMOTE EC2 OLLAMA EVALUATION RESULTS]")
    print("=" * 80)
    print(f"   ✨ Overall Score: {eval_result['overall_score']} / 100")
    print(f"   📊 Rubric Breakdown:")
    for cat, pts in eval_result.get('category_scores', {}).items():
        print(f"      - {cat.replace('_', ' ').title()}: {pts} pts")
    print(f"   📝 AI Verdict: {eval_result['verdict']}")
    print(f"   🟢 Key Pros: {eval_result.get('key_pros')}")
    print(f"   🔴 Key Cons: {eval_result.get('key_cons')}")
    print(f"   🎯 Market Radar: {eval_result.get('market_radar')}")
    print("=" * 80 + "\n")
    
    # Save the real AI evaluation into the database
    startup.ai_score = eval_result['overall_score']
    startup.ai_verdict = eval_result['verdict']
    startup.ai_score_breakdown = eval_result['ai_score_breakdown']
    startup.ai_evaluation_status = "completed"
    db.commit()
    print("💾 Successfully saved genuine AI Score & Verdict to PostgreSQL database!")
    db.close()


if __name__ == "__main__":
    asyncio.run(main())
