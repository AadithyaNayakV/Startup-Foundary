import os
import json
import logging
import re
from typing import Dict, Any
import httpx

from core.config import settings
from services.scraper import scrape_website_meta

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", getattr(settings, "OLLAMA_BASE_URL", "http://16.113.91.178:11434") or "http://16.113.91.178:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", getattr(settings, "OLLAMA_MODEL", "qwen2.5:7b") or "qwen2.5:7b")


def generate_market_radar(
    name: str,
    domains: list,
    tagline: str = "",
    description: str = "",
    website_url: str = "",
) -> Dict[str, Any]:
    """
    Generates structured AI Market & Competitor Intelligence Radar report for a startup.
    Uses local/remote Ollama LLM inference with a deterministic fallback heuristic.
    """
    domains_str = ", ".join(domains) if domains else "Technology"

    scraped_context = ""
    if website_url and (website_url.startswith("http://") or website_url.startswith("https://")):
        try:
            site_data = scrape_website_meta(website_url)
            title = site_data.get("title", "")
            desc = site_data.get("description", "")
            scraped_context = f"{title} - {desc}"[:1000]
        except Exception as e:
            logger.warning(f"Scraper error for {website_url}: {e}")

    prompt = f"""You are a Senior Venture Capital Market Research Analyst.
Analyze the market landscape for this startup and return ONLY a valid JSON object (no surrounding conversational markdown).

=== STARTUP CONTEXT ===
- Startup Name: {name}
- Tagline: {tagline}
- Primary Domains: {domains_str}
- Description: {description}
- Website Context: {scraped_context}

Return a valid JSON object matching EXACTLY this structure:
{{
  "tam_size": "$XX.X Billion (Total Addressable Market size)",
  "sam_size": "$X.X Billion (Serviceable Addressable Market size)",
  "cagr_pct": 14.5,
  "top_competitors": [
    {{ "name": "Competitor 1", "strengths": "Strong brand awareness and global reach" }},
    {{ "name": "Competitor 2", "strengths": "Proprietary technology stack and enterprise sales team" }},
    {{ "name": "Competitor 3", "strengths": "Lower pricing model and open-source ecosystem" }}
  ],
  "tailwinds": [
    "Rapid adoption of automation in key industry verticals",
    "Increased enterprise allocation for digital transformation",
    "Favorable macroeconomic shifts towards efficiency"
  ],
  "market_risks": [
    "High customer acquisition cost in saturated market segments",
    "Regulatory compliance overhead in target jurisdictions"
  ]
}}
"""

    # 1. Attempt Ollama inference
    try:
        api_url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_predict": 1024,
            },
        }

        with httpx.Client(timeout=15.0) as client:
            resp = client.post(api_url, json=payload)
            if resp.status_code == 200:
                raw_response = resp.json().get("response", "")
                # Extract JSON block
                json_match = re.search(r"\{[\s\S]*\}", raw_response)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    if "tam_size" in parsed and "top_competitors" in parsed:
                        return parsed
    except Exception as err:
        logger.warning(f"Ollama Market Radar generation failed or timed out: {err}. Using deterministic fallback.")

    # 2. Robust deterministic fallback Market Radar Report
    primary_domain = domains[0] if domains else "Tech"
    return {
        "tam_size": f"${35.4 if primary_domain == 'AI' else 24.8} Billion",
        "sam_size": f"${6.2 if primary_domain == 'AI' else 4.1} Billion",
        "cagr_pct": 16.8,
        "top_competitors": [
            {
                "name": f"Legacy {primary_domain} Leader Inc",
                "strengths": "Established market presence and deep enterprise channel partnerships",
            },
            {
                "name": f"Global {primary_domain} Solutions",
                "strengths": "Broad product suite with bundled pricing options",
            },
            {
                "name": f"Fast-growing {primary_domain} Unicorn",
                "strengths": "High product velocity and developer-first community adoption",
            },
        ],
        "tailwinds": [
            f"Accelerating global demand for modernized {primary_domain} workflows",
            "Macro transition toward automated cloud and data-driven infrastructure",
            "Increasing regulatory push for secure, compliant software architectures",
        ],
        "market_risks": [
            "Competitive price compression from well-capitalized incumbents",
            "Sales cycle length in enterprise and mid-market accounts",
        ],
    }
