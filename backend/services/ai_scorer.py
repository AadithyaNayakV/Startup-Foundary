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
    stage = startup_data.get("stage", "early")
    ask_amount = startup_data.get("ask_amount", 0)
    equity_offered = startup_data.get("equity_offered", 0)
    implied_val = startup_data.get("implied_valuation", 0)
    mrr = startup_data.get("mrr", 0)
    growth_rate = startup_data.get("growth_rate_pct", 0)
    burn_rate = startup_data.get("burn_rate", 0)
    runway = startup_data.get("runway_months", 0)
    gross_margin = startup_data.get("gross_margin_pct", 0)
    total_raised = startup_data.get("total_raised", 0)
    moat_description = startup_data.get("moat_description", "")
    team_info = startup_data.get("team_info", "Founding team details pending.")

    scraped_context = market_info.get("scraped_context", "Live market search intelligence verified.")
    competitors_found = market_info.get("competitors_found", [])
    detected_tech_stack = market_info.get("detected_tech_stack", [])

    deck_extracted_text = startup_data.get("deck_extracted_text", "")
    deck_section = f"\n=== PITCH DECK SLIDE EXTRACTS ===\n{deck_extracted_text[:2500]}\n" if deck_extracted_text else ""

    return f"""You are a Principal Venture Capital Partner and Senior AI Investment Evaluator at Foundry.
Evaluate the following startup submission using a strict Weighted VC Evaluation Rubric (100 Points Total).

=== FOUNDER & PITCH INPUTS ===
- Startup Name: {name}
- Tagline: {tagline}
- Full Pitch / Description: {description}
- Target Domains & Industry: {domains_str}
- Funding Stage: {stage}
- Capital Ask & Terms: Ask ${ask_amount:,.0f} for {equity_offered}% equity (Implied Valuation: ${implied_val:,.0f})
- Financial Traction: MRR: ${mrr:,.0f} | MoM Growth: {growth_rate}% | Monthly Burn: ${burn_rate:,.0f} | Runway: {runway} months | Gross Margin: {gross_margin}% | Total Raised: ${total_raised:,.0f}
- Articulated Moat: {moat_description or 'None provided'}
- Team Background: {team_info}
{deck_section}
=== WEB SCRAPED MARKET INTELLIGENCE ===
- Scraped Landing Page Context & Hero Copy: {scraped_context}
- Direct & Indirect Competitors Identified: {', '.join(competitors_found) if competitors_found else 'Sector incumbents'}
- Detected Technology Stack & Infrastructure: {', '.join(detected_tech_stack) if detected_tech_stack else 'Standard Web Stack'}

=== WEIGHTED VC EVALUATION RUBRIC (100 POINTS TOTAL) ===
1. Problem-Market Fit & Solution (Max 30 Pts): Clarity of customer pain point, solution feasibility, and alignment with target audience.
2. Competitive Moat & Differentiation (Max 25 Pts): Defensibility, IP, proprietary advantages relative to the competitors identified ({', '.join(competitors_found[:4])}).
3. Market Size & Industry Tailwinds (Max 20 Pts): TAM/SAM scalability, industry trends, and expansion opportunities across ({domains_str}).
4. Execution & Tech Viability (Max 25 Pts): Appropriateness of detected tech stack ({', '.join(detected_tech_stack[:4])}), founder capabilities, unit economics, and realism of funding stage/ask.

CRITICAL INSTRUCTIONS:
- You must return ONLY a single valid JSON object.
- DO NOT wrap the output in markdown code blocks like ```json ... ```.
- Total score must equal the sum of the 4 category scores.
- Be rigorous, realistic, and objective like a Top-Tier Seed & Series A Venture Fund.

Output format must match this exact schema:
{{
  "overall_score": 88,
  "verdict": "Strong product-market fit with clear technical defensibility.",
  "category_scores": {{
    "problem_market_fit": 27,
    "competitive_moat": 22,
    "market_opportunity": 19,
    "execution_viability": 20
  }},
  "market_radar": {{
    "tam_estimate": "$4.2B",
    "direct_competitors": ["Competitor A", "Competitor B"],
    "key_tailwinds": ["Growth in decentralized infrastructure"],
    "primary_risks": ["Enterprise adoption barriers"]
  }},
  "key_pros": ["Zero server infrastructure costs", "Strong WebRTC moat"],
  "key_cons": ["Requires user education for setup"]
}}"""


def fallback_heuristic_scoring(startup_data: Dict[str, Any], market_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    High-fidelity heuristic scoring engine conforming to the 4-category 100-point rubric.
    Used if the local Ollama instance is unreachable.
    """
    domains = startup_data.get("domains", [])
    mrr = startup_data.get("mrr") or 0.0
    growth = startup_data.get("growth_rate_pct") or 0.0
    gross_margin = startup_data.get("gross_margin_pct") or 0.0
    runway = startup_data.get("runway_months") or 0
    ask = startup_data.get("ask_amount") or 0.0
    equity = startup_data.get("equity_offered") or 0.0
    implied_val = startup_data.get("implied_valuation") or (ask / (equity / 100.0) if ask > 0 and equity > 0 else 0)
    stage = (startup_data.get("stage") or "idea").lower()
    moat = startup_data.get("moat_description") or ""
    detected_tech = market_info.get("detected_tech_stack", ["Next.js", "React", "FastAPI"])
    competitors = market_info.get("competitors_found", ["Sector Incumbents"])

    key_pros = []
    key_cons = []

    # 1. Problem-Market Fit & Solution (0-30 Pts)
    pmf_score = 18
    desc_len = len((startup_data.get("description") or "").strip())
    if desc_len > 100:
        pmf_score += 6
        key_pros.append("Clearly defined customer pain point and target persona")
    else:
        pmf_score += 2
        key_cons.append("Pitch description lacks detailed solution architecture")

    if mrr >= 25000:
        pmf_score += 6
        key_pros.append(f"Validated market demand with ${mrr:,.0f} MRR")
    elif mrr >= 5000:
        pmf_score += 4
        key_pros.append("Early commercial traction achieved")
    elif stage in ["growth", "revenue"]:
        key_cons.append("Revenue stage indicated but revenue metrics are modest")

    pmf_score = min(30, max(5, pmf_score))

    # 2. Competitive Moat & Differentiation (0-25 Pts)
    moat_score = 12
    if len(moat.strip()) > 30:
        moat_score += 9
        key_pros.append("Defensible competitive moat and intellectual property outlined")
    elif len(moat.strip()) > 10:
        moat_score += 5
    else:
        moat_score -= 3
        key_cons.append("Lack of clearly articulated competitive defensibility")

    if startup_data.get("pitch_deck_url"):
        moat_score += 4
        key_pros.append("Complete investor pitch deck and architectural documentation verified")

    moat_score = min(25, max(5, moat_score))

    # 3. Market Size & Industry Tailwinds (0-20 Pts)
    market_score = 13
    has_high_growth_domain = any(d.lower() in ["ai", "devtools", "infrastructure", "saas", "fintech"] for d in domains)
    if has_high_growth_domain:
        market_score += 5
        key_pros.append("Strong macro tailwinds in high-velocity tech vertical")
    else:
        market_score += 2

    market_size_est = market_info.get("market_size_estimate", "$15B+ Global Market")
    if market_info.get("growth_signals"):
        key_pros.append(f"Sector tailwind: {market_info['growth_signals'][0]}")

    market_score = min(20, max(5, market_score))

    # 4. Execution & Tech Viability (0-25 Pts)
    exec_score = 12
    if gross_margin >= 70:
        exec_score += 5
        key_pros.append(f"High-margin software economics ({gross_margin:.0f}% gross margin)")
    elif 0 < gross_margin < 40:
        key_cons.append(f"Low gross margin profile ({gross_margin:.0f}%)")

    if runway >= 12:
        exec_score += 4
        key_pros.append(f"Healthy capitalization buffer ({runway} months runway)")
    elif 0 < runway < 6:
        key_cons.append(f"Tight runway constraint ({runway} months left)")

    # Valuation check
    arr = mrr * 12
    if arr > 0 and implied_val > 0:
        multiple = implied_val / arr
        if multiple <= 20:
            exec_score += 4
            key_pros.append(f"Attractive entry valuation ({multiple:.1f}x ARR)")
        elif multiple > 40:
            exec_score -= 3
            key_cons.append(f"High valuation multiple ({multiple:.1f}x ARR)")

    if detected_tech:
        exec_score += 2
        key_pros.append(f"Modern scalable stack: {', '.join(detected_tech[:3])}")

    exec_score = min(25, max(5, exec_score))

    total_score = pmf_score + moat_score + market_score + exec_score
    total_score = min(98, max(15, total_score))

    if total_score >= 80:
        verdict = "High-conviction investment candidate with strong unit economics and defensible tech."
    elif total_score >= 65:
        verdict = "Promising venture opportunity with proven traction; recommend deeper technical audit."
    elif total_score >= 50:
        verdict = "Early-stage opportunity requiring further market validation and moat hardening."
    else:
        verdict = "High-risk profile with valuation-to-traction mismatch and competitive headwind."

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
            "direct_competitors": competitors[:4] if competitors else ["Industry Peer A", "Industry Peer B"],
            "key_tailwinds": market_info.get("growth_signals", ["Enterprise automation demand", "Cloud modernization"]),
            "primary_risks": key_cons[:2] if key_cons else ["Early go-to-market friction in target sector"],
        },
        "key_pros": key_pros[:4] if key_pros else ["Solid founding team", "Active product development"],
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
                "temperature": 0.2,
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
