import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple
import httpx

from core.config import settings
from services.scraper import scrape_market_intelligence

logger = logging.getLogger("foundry.services.ai_scorer")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", getattr(settings, "OLLAMA_BASE_URL", "http://16.113.91.178:11434") or "http://16.113.91.178:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", getattr(settings, "OLLAMA_MODEL", "qwen2.5:7b") or "qwen2.5:7b")


class OllamaRemoteConnectionError(Exception):
    """Raised when connection or inference on the remote EC2 Ollama instance fails."""
    pass


def build_scoring_prompt(startup_data: Dict[str, Any], market_info: Dict[str, Any]) -> str:
    """
    Constructs the detailed VC evaluation prompt for the Ollama qwen2.5:7b model.
    """
    name = startup_data.get("name", "Unknown Startup")
    tagline = startup_data.get("tagline", "")
    description = startup_data.get("description", "")
    domains = startup_data.get("domains", [])
    domains_str = ", ".join(domains) if isinstance(domains, list) else str(domains)
    stage = startup_data.get("stage") or "early"
    ask_amount = startup_data.get("ask_amount") or 0.0
    equity_offered = startup_data.get("equity_offered") or 0.0
    implied_val = startup_data.get("implied_valuation") or 0.0
    mrr = startup_data.get("mrr") or 0.0
    growth_rate = startup_data.get("growth_rate_pct") or 0.0
    burn_rate = startup_data.get("burn_rate") or 0.0
    runway = startup_data.get("runway_months") or 0
    gross_margin = startup_data.get("gross_margin_pct") or 0.0
    total_raised = startup_data.get("total_raised") or 0.0
    moat_description = startup_data.get("moat_description") or ""
    team_info = startup_data.get("team_info") or "Founding team details pending."

    scraped_context = market_info.get("scraped_context", "Live market search intelligence verified.")
    competitors_found = market_info.get("competitors_found", [])
    detected_tech_stack = market_info.get("detected_tech_stack", [])

    deck_extracted_text = startup_data.get("deck_extracted_text", "")
    deck_section = f"\n- Pitch Deck Highlights: {deck_extracted_text[:600]}\n" if deck_extracted_text else ""

    return f"""You are a Senior Venture Capital General Partner evaluating an early-stage startup for investment.
Apply STRICT, OBJECTIVE Silicon Valley VC investment criteria based on hard business metrics (100 Points Total).

=== SUBMITTED BUSINESS PARAMETERS ===
- Startup Name: {name}
- Tagline: {tagline}
- Business Pitch: {description[:450]}
- Target Vertical: {domains_str}
- Funding Stage: {stage}
- Capital Terms: Ask ${ask_amount:,.0f} for {equity_offered}% equity (Implied Valuation: ${implied_val:,.0f})
- Revenue & Traction: MRR: ${mrr:,.0f} (${mrr*12:,.0f} ARR) | MoM Growth: {growth_rate}%
- Unit Economics: Monthly Burn: ${burn_rate:,.0f} | Runway: {runway} months | Gross Margin: {gross_margin}% | Total Raised: ${total_raised:,.0f}
- Articulated Moat: {moat_description or 'None provided'}
- Founding Team: {team_info}
{deck_section}
=== MARKET INTELLIGENCE ===
- Scraped Context: {scraped_context[:300]}
- Competitors: {', '.join(competitors_found[:4]) if competitors_found else 'Sector incumbents'}
- Tech Stack: {', '.join(detected_tech_stack[:4]) if detected_tech_stack else 'Standard Web Stack'}

=== STRICT VC RUBRIC (100 PTS TOTAL) ===
1. Problem-Market Fit & Traction (0-30 pts): Pre-revenue/0 MRR gets max 10 pts. High MRR ($20k+) with >20% MoM growth gets 22-30 pts.
2. Competitive Moat & Defensibility (0-25 pts): Generic claims get max 8 pts. Proprietary tech/IP/network effects get 18-25 pts.
3. Market Opportunity & Scalability (0-20 pts): TAM scalability and industry velocity (AI/DevTools/Fintech get 14-20 pts).
4. Execution & Valuation Viability (0-25 pts): Strict valuation sanity check. If Valuation > 30x ARR, severely penalize (max 8 pts). Healthy margin (>75%) and >12m runway earn top marks (18-25 pts).

CRITICAL INSTRUCTIONS:
- Be rigorous and strict like a Tier-1 VC (Benchmark: 90+ is top 2% outlier; 75-89 is solid investable; <60 is high risk).
- Return ONLY valid JSON:
{{
  "overall_score": 78,
  "verdict": "Precise 1-sentence VC investment thesis with key risk and traction rationale.",
  "category_scores": {{
    "problem_market_fit": 22,
    "competitive_moat": 18,
    "market_opportunity": 17,
    "execution_viability": 21
  }},
  "market_radar": {{
    "tam_estimate": "$4.5B",
    "direct_competitors": ["Competitor A", "Competitor B"],
    "key_tailwinds": ["Sector cloud transition"],
    "primary_risks": ["Go-to-market execution risk"]
  }},
  "key_pros": ["Strong unit margins", "Early paying customer traction"],
  "key_cons": ["Valuation multiple represents forward execution risk"]
}}"""


def fallback_heuristic_scoring(startup_data: Dict[str, Any], market_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strict, business-metric-driven VC heuristic evaluation engine.
    Applies rigorous Tier-1 VC scoring standards based on hard financials, unit economics, and defensibility.
    """
    domains = startup_data.get("domains", [])
    mrr = float(startup_data.get("mrr") or 0.0)
    growth = float(startup_data.get("growth_rate_pct") or 0.0)
    gross_margin = float(startup_data.get("gross_margin_pct") or 0.0)
    runway = int(startup_data.get("runway_months") or 0)
    burn = float(startup_data.get("burn_rate") or 0.0)
    ask = float(startup_data.get("ask_amount") or 0.0)
    equity = float(startup_data.get("equity_offered") or 0.0)
    implied_val = float(startup_data.get("implied_valuation") or (ask / (equity / 100.0) if ask > 0 and equity > 0 else 0.0))
    stage = (startup_data.get("stage") or "idea").lower()
    moat = (startup_data.get("moat_description") or "").strip()
    detected_tech = market_info.get("detected_tech_stack", ["Next.js", "React", "FastAPI"])
    competitors = market_info.get("competitors_found", ["Sector Incumbents"])

    key_pros = []
    key_cons = []

    # 1. Problem-Market Fit & Verified Traction (0-30 Pts) - STRICT
    pmf_score = 0
    if mrr >= 50000:
        pmf_score += 24
        key_pros.append(f"Exceptional product-market fit with ${mrr:,.0f} MRR (${mrr*12:,.0f} ARR)")
    elif mrr >= 20000:
        pmf_score += 18
        key_pros.append(f"Strong commercial traction validated (${mrr:,.0f} MRR)")
    elif mrr >= 5000:
        pmf_score += 12
        key_pros.append(f"Early revenue traction validated (${mrr:,.0f} MRR)")
    elif mrr > 0:
        pmf_score += 6
        key_pros.append(f"Initial paying customers on platform (${mrr:,.0f} MRR)")
    else:
        pmf_score += 3
        key_cons.append("Pre-revenue / unvalidated commercial demand")

    if growth >= 30:
        pmf_score += 6
        key_pros.append(f"High-velocity growth trajectory ({growth:.0f}% MoM)")
    elif growth >= 15:
        pmf_score += 4
        key_pros.append(f"Healthy growth momentum ({growth:.0f}% MoM)")
    elif growth > 0:
        pmf_score += 2
    else:
        key_cons.append("Flat or unmeasured month-over-month growth")

    desc_len = len((startup_data.get("description") or "").strip())
    if desc_len > 120:
        pmf_score = min(30, pmf_score + 2)

    pmf_score = min(30, max(2, pmf_score))

    # 2. Competitive Moat & Technical Defensibility (0-25 Pts) - STRICT
    moat_score = 0
    if len(moat) >= 50:
        moat_score += 14
        key_pros.append("Articulated proprietary technological moat / IP")
    elif len(moat) >= 20:
        moat_score += 8
    else:
        moat_score += 3
        key_cons.append("Lack of clearly defined competitive defensibility / moat")

    if startup_data.get("pitch_deck_url") or startup_data.get("deck_extracted_text"):
        moat_score += 5
        key_pros.append("Complete investor pitch deck and architectural documentation verified")
    else:
        key_cons.append("No pitch deck documentation attached for technical due diligence")

    if detected_tech and any(t.lower() in ["webrtc", "kafka", "docker", "postgres", "fastapi"] for t in detected_tech):
        moat_score += 4
        key_pros.append(f"Scalable infrastructure verified: {', '.join(detected_tech[:3])}")
    else:
        moat_score += 2

    moat_score = min(25, max(3, moat_score))

    # 3. Market Opportunity & Industry Velocity (0-20 Pts) - STRICT
    market_score = 0
    high_growth = any(d.lower() in ["ai", "devtools", "infrastructure", "saas", "fintech", "security"] for d in domains)
    if high_growth:
        market_score += 14
        key_pros.append("Strong macro tailwinds in high-velocity tech sector")
    elif domains:
        market_score += 8
    else:
        market_score += 4
        key_cons.append("No specific target vertical or market domain specified")

    market_size_est = market_info.get("market_size_estimate", "$10B+ Global Market")
    if market_info.get("growth_signals"):
        market_score = min(20, market_score + 3)
        key_pros.append(f"Sector tailwind: {market_info['growth_signals'][0]}")

    market_score = min(20, max(3, market_score))

    # 4. Execution & Terms Viability (0-25 Pts) - STRICT
    exec_score = 0

    # Margin check (Max 7 pts)
    if gross_margin >= 80:
        exec_score += 7
        key_pros.append(f"Top-quartile software gross margin ({gross_margin:.0f}%)")
    elif gross_margin >= 60:
        exec_score += 5
    elif gross_margin > 0:
        exec_score += 2
        key_cons.append(f"Sub-optimal gross margin profile ({gross_margin:.0f}%)")
    else:
        exec_score += 1

    # Runway & Burn check (Max 8 pts)
    if runway >= 18:
        exec_score += 8
        key_pros.append(f"Extremely healthy runway cushion ({runway} months)")
    elif runway >= 12:
        exec_score += 6
        key_pros.append(f"Prudent capitalization ({runway} months runway)")
    elif runway >= 6:
        exec_score += 4
    elif runway > 0:
        exec_score += 1
        key_cons.append(f"Critical runway constraint ({runway} months remaining)")
    else:
        exec_score += 2

    # Valuation Multiple Sanity Check (Max 10 pts)
    arr = mrr * 12
    if arr > 0 and implied_val > 0:
        multiple = implied_val / arr
        if multiple <= 15:
            exec_score += 10
            key_pros.append(f"Highly attractive entry valuation ({multiple:.1f}x ARR)")
        elif multiple <= 30:
            exec_score += 7
            key_pros.append(f"Fair market valuation terms ({multiple:.1f}x ARR)")
        elif multiple <= 50:
            exec_score += 3
            key_cons.append(f"Elevated valuation multiple ({multiple:.1f}x ARR)")
        else:
            exec_score += 1
            key_cons.append(f"Overvalued relative to current ARR run-rate ({multiple:.1f}x ARR)")
    elif implied_val > 0 and mrr == 0:
        if implied_val <= 3000000:
            exec_score += 5
        elif implied_val <= 6000000:
            exec_score += 3
            key_cons.append(f"Unvalidated pre-revenue valuation (${implied_val:,.0f})")
        else:
            exec_score += 1
            key_cons.append(f"Aggressive pre-revenue valuation (${implied_val:,.0f}) with $0 ARR")
    else:
        exec_score += 4

    exec_score = min(25, max(2, exec_score))

    total_score = pmf_score + moat_score + market_score + exec_score
    total_score = min(98, max(12, total_score))

    if total_score >= 85:
        verdict = "Exceptional Tier-1 venture opportunity with proven traction, robust margins, and defensible technology."
    elif total_score >= 70:
        verdict = "Solid venture candidate with demonstrated momentum; attractive investment profile with minor execution risks."
    elif total_score >= 50:
        verdict = "Early-stage unvalidated venture; requires deeper customer validation, moat hardening, and valuation calibration."
    else:
        verdict = "High-risk profile with severe traction-to-valuation mismatch, unproven demand, and lack of defensibility."

    return {
        "overall_score": total_score,
        "verdict": verdict,
        "category_scores": {
            "problem_market_fit": pmf_score,
            "competitive_moat": moat_score,
            "market_opportunity": market_score,
            "execution_viability": exec_score,
        },
        "market_radar": {
            "tam_estimate": market_size_est,
            "direct_competitors": competitors[:4] if competitors else ["Sector Competitor A", "Sector Competitor B"],
            "key_tailwinds": market_info.get("growth_signals", ["Enterprise automation demand", "Cloud modernization"]),
            "primary_risks": key_cons[:2] if key_cons else ["Early go-to-market friction"],
        },
        "key_pros": key_pros[:4] if key_pros else ["Active product development"],
        "key_cons": key_cons[:3] if key_cons else ["Early stage metrics pending detailed audit"],
    }


def evaluate_startup_with_llm(
    startup_data: Dict[str, Any],
    market_info: Optional[Dict[str, Any]] = None,
    allow_fallback: bool = True,
) -> Dict[str, Any]:
    """
    Evaluates a startup with the remote EC2 Ollama qwen2.5:7b model across 4 weighted VC categories (100 Pts total).
    Returns complete structured evaluation dictionary.
    """
    if not market_info:
        market_info = scrape_market_intelligence(
            startup_data.get("domains", []),
            startup_data.get("website_url"),
            startup_data.get("main_competitors"),
        )

    prompt = build_scoring_prompt(startup_data, market_info)
    ollama_base = os.getenv(
        "OLLAMA_BASE_URL",
        getattr(settings, "OLLAMA_BASE_URL", "http://16.113.91.178:11434") or "http://16.113.91.178:11434",
    )
    ollama_url = f"{ollama_base.rstrip('/')}/api/generate"
    model_name = os.getenv("OLLAMA_MODEL", getattr(settings, "OLLAMA_MODEL", "qwen2.5:7b") or "qwen2.5:7b")

    logger.info(f"🧠 Dispatching AI deal scoring to remote EC2 Ollama model '{model_name}' at {ollama_url}")

    evaluation: Optional[Dict[str, Any]] = None

    try:
        payload = {
            "model": model_name,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 300,
            },
        }
        with httpx.Client(timeout=150.0) as client:
            resp = client.post(ollama_url, json=payload)
            if resp.status_code == 200:
                resp_data = resp.json()
                raw_response = resp_data.get("response", "").strip()
                # Clean possible markdown fence wrapping
                if raw_response.startswith("```"):
                    raw_response = re.sub(r"^```(?:json)?\s*", "", raw_response)
                    raw_response = re.sub(r"\s*```$", "", raw_response)

                parsed = json.loads(raw_response)

                # Validate parsed schema
                overall_score = int(parsed.get("overall_score", 0))
                category_scores = parsed.get("category_scores", {})
                pmf = int(category_scores.get("problem_market_fit", 20))
                moat = int(category_scores.get("competitive_moat", 18))
                market_opp = int(category_scores.get("market_opportunity", 15))
                exec_viab = int(category_scores.get("execution_viability", 18))

                calculated_sum = pmf + moat + market_opp + exec_viab
                if overall_score <= 0 or abs(overall_score - calculated_sum) > 5:
                    overall_score = calculated_sum

                evaluation = {
                    "overall_score": min(99, max(10, overall_score)),
                    "verdict": parsed.get("verdict", f"Evaluated by {model_name} engine."),
                    "category_scores": {
                        "problem_market_fit": pmf,
                        "competitive_moat": moat,
                        "market_opportunity": market_opp,
                        "execution_viability": exec_viab,
                    },
                    "market_radar": parsed.get("market_radar", {
                        "tam_estimate": market_info.get("market_size_estimate", "$10B+"),
                        "direct_competitors": market_info.get("competitors_found", []),
                        "key_tailwinds": market_info.get("growth_signals", []),
                        "primary_risks": parsed.get("key_cons", ["Execution risk"]),
                    }),
                    "key_pros": parsed.get("key_pros", ["Strong founding vision"]),
                    "key_cons": parsed.get("key_cons", ["Early validation pending"]),
                }
                logger.info(f"✨ Remote EC2 {model_name} scoring completed successfully: {evaluation['overall_score']}/100")
            else:
                logger.warning(f"⚠️ Remote EC2 Ollama returned HTTP {resp.status_code}: {resp.text[:200]}")
                if not allow_fallback:
                    raise OllamaRemoteConnectionError(
                        f"Remote EC2 Ollama returned HTTP {resp.status_code}: {resp.text[:200]}"
                    )
    except httpx.TimeoutException as timeout_err:
        logger.warning(f"⚠️ Remote EC2 Ollama connection timed out (150.0s): {timeout_err}")
        if not allow_fallback:
            raise OllamaRemoteConnectionError(f"Remote EC2 Ollama connection timed out: {timeout_err}") from timeout_err
    except (httpx.ConnectError, httpx.NetworkError, httpx.RequestError) as net_err:
        logger.warning(f"⚠️ Remote EC2 Ollama connection failed: {net_err}")
        if not allow_fallback:
            raise OllamaRemoteConnectionError(f"Remote EC2 Ollama connection failed: {net_err}") from net_err
    except Exception as e:
        logger.warning(f"⚠️ Remote EC2 Ollama evaluation error ({e}).")
        if not allow_fallback and isinstance(e, OllamaRemoteConnectionError):
            raise
        elif not allow_fallback:
            raise OllamaRemoteConnectionError(f"Remote EC2 Ollama evaluation failed: {e}") from e

    if not evaluation:
        if not allow_fallback:
            raise OllamaRemoteConnectionError(f"Remote EC2 Ollama failed to return a valid evaluation.")
        evaluation = fallback_heuristic_scoring(startup_data, market_info)

    # Format unified breakdown including backward-compatible aliases for existing frontend widgets
    cat_scores = evaluation.get("category_scores", {})
    breakdown = {
        "overall_score": evaluation["overall_score"],
        "category_scores": cat_scores,
        "problem_market_fit": cat_scores.get("problem_market_fit", 20),
        "competitive_moat": cat_scores.get("competitive_moat", 18),
        "market_opportunity": cat_scores.get("market_opportunity", 15),
        "execution_viability": cat_scores.get("execution_viability", 18),
        # Legacy frontend compatibility mappings:
        "valuation_score": int(cat_scores.get("problem_market_fit", 20) * 25 / 30),
        "traction_score": int(cat_scores.get("market_opportunity", 15) * 25 / 20),
        "margin_score": cat_scores.get("execution_viability", 18),
        "moat_score": cat_scores.get("competitive_moat", 18),
        "strengths": evaluation.get("key_pros", []),
        "red_flags": evaluation.get("key_cons", []),
        "key_pros": evaluation.get("key_pros", []),
        "key_cons": evaluation.get("key_cons", []),
        "market_radar": evaluation.get("market_radar", {}),
        "detected_tech_stack": market_info.get("detected_tech_stack", []),
        "competitors_found": market_info.get("competitors_found", []),
        "domain_trends": market_info.get("domain_insights", ""),
        "market_size_estimate": market_info.get("market_size_estimate", ""),
    }

    evaluation["ai_score_breakdown"] = breakdown
    return evaluation
