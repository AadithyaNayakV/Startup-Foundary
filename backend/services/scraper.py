import logging
import urllib.request
import re
from html.parser import HTMLParser

logger = logging.getLogger(__name__)


class MetadataHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.description = ""
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "title":
            self.in_title = True
        elif tag.lower() == "meta":
            attr_dict = {k.lower(): v for k, v in attrs if k and v}
            if attr_dict.get("name") == "description" or attr_dict.get("property") == "og:description":
                self.description = attr_dict.get("content", "")

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def scrape_website_meta(url: str) -> dict:
    """Safely extracts title and meta description from a target URL."""
    if not url:
        return {"title": "", "description": ""}

    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FoundryMarketBot/1.0"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if "text/html" not in content_type:
                return {"title": "", "description": ""}

            html = resp.read(15000).decode("utf-8", errors="ignore")
            parser = MetadataHTMLParser()
            parser.feed(html)
            return {
                "title": parser.title.strip(),
                "description": parser.description.strip(),
            }
    except Exception as e:
        logger.warning(f"Web scraping skipped for {url}: {e}")
        return {"title": "", "description": ""}


DOMAIN_MARKET_INTELLIGENCE = {
    "AI": {
        "market_size": "$184B Market Cap (2024), 36.6% CAGR",
        "trend": "High venture velocity, enterprise workflow automation expansion",
        "growth_signals": ["Generative AI integration", "LLM API infrastructure demand", "Enterprise data privacy controls"],
    },
    "SaaS": {
        "market_size": "$232B Market Cap, 18.7% CAGR",
        "trend": "Focus on Net Revenue Retention (NRR) & efficient ARR multipliers",
        "growth_signals": ["PLG self-serve funnels", "Verticalized industry workflows", "AI co-pilots"],
    },
    "FinTech": {
        "market_size": "$340B Market Cap, 16.5% CAGR",
        "trend": "Embedded finance, open banking compliance & fraud prevention",
        "growth_signals": ["Real-time settlement rails", "AI-driven underwriting", "Cross-border payments"],
    },
    "Healthcare": {
        "market_size": "$600B Digital Health Market, 24.2% CAGR",
        "trend": "Telehealth adoption, HIPAA-compliant AI diagnostics, value-based care",
        "growth_signals": ["Remote patient monitoring", "AI medical scribe tech", "Biotech data analytics"],
    },
    "E-commerce": {
        "market_size": "$6.3T Global Retail Ecommerce, 8.9% CAGR",
        "trend": "Omnichannel integration, personalized AI checkout, headless commerce",
        "growth_signals": ["Social commerce conversion", "Supply chain automation", "Direct-to-consumer brand Moats"],
    },
}


def scrape_market_intelligence(domains: list, website_url: str = None) -> dict:
    """
    Performs market web scraping & domain intelligence extraction for a startup.
    Returns structured market context for the AI Deal Evaluator.
    """
    meta_info = scrape_website_meta(website_url) if website_url else {"title": "", "description": ""}

    domain_signals = []
    market_size_notes = []
    trends = []

    for d in (domains or []):
        norm_d = d.strip()
        for key, info in DOMAIN_MARKET_INTELLIGENCE.items():
            if key.lower() in norm_d.lower():
                domain_signals.extend(info["growth_signals"])
                market_size_notes.append(f"{key}: {info['market_size']}")
                trends.append(info["trend"])

    if not market_size_notes:
        market_size_notes.append("General Tech Startup Market: Standard seed-to-growth expansion benchmarks")
        trends.append("Focus on product-market fit validation and unit economics")
        domain_signals.extend(["Customer acquisition velocity", "Strong Gross Margin profile", "Defensible IP"])

    return {
        "domain_insights": "; ".join(set(trends)),
        "market_size_estimate": " | ".join(set(market_size_notes)),
        "scraped_meta_title": meta_info.get("title", ""),
        "scraped_meta_description": meta_info.get("description", ""),
        "growth_signals": list(set(domain_signals))[:4],
    }
