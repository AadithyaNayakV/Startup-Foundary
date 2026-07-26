"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const PREDEFINED_DOMAINS = [
  "AI / Machine Learning",
  "SaaS",
  "FinTech",
  "Healthcare",
  "E-commerce",
  "CleanTech",
  "EdTech",
  "Consumer",
  "B2B Marketplaces",
  "Hardware / IoT",
  "Cybersecurity",
  "Web3 / Crypto",
];

export default function EditStartupPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const searchTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const [deckUploading, setDeckUploading] = useState(false);
  const [deckError, setDeckError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    stage: "idea",
    funding_needed: "",
    website_url: "",
    logo_url: "",
    pitch_deck_url: "",
    ask_amount: "",
    equity_offered: "",
    implied_valuation: "",
    use_of_funds: "",
    mrr: "",
    growth_rate_pct: "",
    burn_rate: "",
    runway_months: "",
    gross_margin_pct: "",
    total_raised: "",
    main_competitors: "",
    moat_description: "",
  });

  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState([]);

  // Teammate selection states
  const [teamMembers, setTeamMembers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!query.trim()) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    setSearchingUsers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(
          `/users/search?q=${encodeURIComponent(query.trim())}`
        );
        setSearchResults(data || []);
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
  };

  const handleSelectUser = (user) => {
    if (teamMembers.some((m) => m.user_id === user.id)) {
      return;
    }
    setTeamMembers([
      ...teamMembers,
      {
        user_id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: "Co-Founder",
      },
    ]);
    setUserSearchQuery("");
    setSearchResults([]);
  };

  const handleUpdateRole = (index, newRole) => {
    const updated = [...teamMembers];
    updated[index].role = newRole;
    setTeamMembers(updated);
  };

  const handleRemoveMember = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const loadStartup = async () => {
      try {
        const { data } = await api.get(`/startups/${id}`);
        setHasPendingUpdate(data.has_pending_update || false);
        setFormData({
          name: data.name || "",
          tagline: data.tagline || "",
          description: data.description || "",
          stage: data.stage || "idea",
          funding_needed: data.funding_needed || "",
          website_url: data.website_url || "",
          logo_url: data.logo_url || "",
          pitch_deck_url: data.pitch_deck_url || "",
          ask_amount: data.ask_amount !== null && data.ask_amount !== undefined ? data.ask_amount : "",
          equity_offered: data.equity_offered !== null && data.equity_offered !== undefined ? data.equity_offered : "",
          implied_valuation: data.implied_valuation !== null && data.implied_valuation !== undefined ? data.implied_valuation : "",
          use_of_funds: data.use_of_funds || "",
          mrr: data.mrr !== null && data.mrr !== undefined ? data.mrr : "",
          growth_rate_pct: data.growth_rate_pct !== null && data.growth_rate_pct !== undefined ? data.growth_rate_pct : "",
          burn_rate: data.burn_rate !== null && data.burn_rate !== undefined ? data.burn_rate : "",
          runway_months: data.runway_months !== null && data.runway_months !== undefined ? data.runway_months : "",
          gross_margin_pct: data.gross_margin_pct !== null && data.gross_margin_pct !== undefined ? data.gross_margin_pct : "",
          total_raised: data.total_raised !== null && data.total_raised !== undefined ? data.total_raised : "",
          main_competitors: data.main_competitors || "",
          moat_description: data.moat_description || "",
        });
        setDomains(data.domains || []);
        setTeamMembers(
          (data.team_members || [])
            .filter((m) => m.role !== "ceo")
            .map((m) => ({
              user_id: m.user_id || m.id,
              name: m.name || m.email,
              email: m.email,
              role: m.role || "Co-Founder",
            }))
        );
      } catch (err) {
        console.error("Failed to load startup:", err);
        setError(err.response?.data?.detail || "Failed to load startup.");
      } finally {
        setLoading(false);
      }
    };

    loadStartup();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };
      if (name === "ask_amount" || name === "equity_offered") {
        const ask = name === "ask_amount" ? value : prev.ask_amount;
        const eq = name === "equity_offered" ? value : prev.equity_offered;
        const askNum = parseFloat(ask);
        const eqNum = parseFloat(eq);
        if (!isNaN(askNum) && !isNaN(eqNum) && eqNum > 0) {
          nextData.implied_valuation = Math.round(askNum / (eqNum / 100));
        }
      }
      return nextData;
    });
  };

  const handleAddDomain = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const val = domainInput.trim().replace(/,/g, "");
      if (val && !domains.includes(val)) {
        setDomains([...domains, val]);
        setDomainInput("");
      }
    }
  };

  const togglePredefinedDomain = (domainName) => {
    if (domains.includes(domainName)) {
      setDomains(domains.filter((d) => d !== domainName));
    } else {
      setDomains([...domains, domainName]);
    }
  };

  const removeDomainItem = (index) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      const { data } = await api.post("/startups/logo-upload", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({ ...prev, logo_url: data.url }));
    } catch (err) {
      setLogoError(
        err.response?.data?.detail || "Failed to upload logo. Try again.",
      );
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDeckUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDeckUploading(true);
    setDeckError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);
      const { data } = await api.post("/startups/pitch-deck-upload", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({ ...prev, pitch_deck_url: data.url }));
    } catch (err) {
      setDeckError(
        err.response?.data?.detail || "Failed to upload pitch deck. Try again.",
      );
    } finally {
      setDeckUploading(false);
    }
  };

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        ask_amount: formData.ask_amount !== "" ? parseFloat(formData.ask_amount) : null,
        equity_offered: formData.equity_offered !== "" ? parseFloat(formData.equity_offered) : null,
        implied_valuation: formData.implied_valuation !== "" ? parseFloat(formData.implied_valuation) : null,
        mrr: formData.mrr !== "" ? parseFloat(formData.mrr) : null,
        growth_rate_pct: formData.growth_rate_pct !== "" ? parseFloat(formData.growth_rate_pct) : null,
        burn_rate: formData.burn_rate !== "" ? parseFloat(formData.burn_rate) : null,
        runway_months: formData.runway_months !== "" ? parseInt(formData.runway_months, 10) : null,
        gross_margin_pct: formData.gross_margin_pct !== "" ? parseFloat(formData.gross_margin_pct) : null,
        total_raised: formData.total_raised !== "" ? parseFloat(formData.total_raised) : null,
        domains,
        team_members: teamMembers.map((m) => ({
          user_id: m.user_id,
          role: m.role || "Co-Founder",
        })),
      };

      await api.put(`/startups/${id}`, payload);
      setSuccess("✓ Startup profile updated successfully! Redirecting...");
      setTimeout(() => {
        router.push(`/founder/startups/${id}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Failed to update startup:", err);
      setError(err.response?.data?.detail || "Failed to update startup.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center text-gray-500">
          Loading startup...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Edit Company Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Update metrics, team members, pitch terms, and media for accredited investors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/founder/startups/${id}`)}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
        >
          View Live Profile ↗
        </button>
      </div>

      {hasPendingUpdate && (
        <div className="p-4 bg-amber-50 text-amber-900 rounded-xl text-sm border border-amber-200 flex items-start gap-3">
          <span className="text-lg">⏳</span>
          <div>
            <div className="font-bold">Pending Revision Notice</div>
            <div className="text-xs text-amber-800 mt-0.5">
              This startup is approved and live. Any edits saved below will be submitted to the Admin Review Queue. Your live profile remains visible while edits are reviewed!
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-200 font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              1. Basic Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Elevator Pitch / Tagline *
              </label>
              <input
                type="text"
                name="tagline"
                required
                value={formData.tagline}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description / Pitch
              </label>
              <textarea
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Development Stage
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="idea">Idea Stage</option>
                  <option value="mvp">MVP / Prototype</option>
                  <option value="early_traction">Early Traction</option>
                  <option value="growth">Growth Stage</option>
                  <option value="scaling">Scaling / Expansion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Capital Target ($)
                </label>
                <input
                  type="text"
                  name="funding_needed"
                  value={formData.funding_needed}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold">
                        No Logo
                      </div>
                    )}
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 transition">
                      {logoUploading ? "Uploading..." : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {logoError && (
                    <p className="text-xs text-red-600 font-medium">
                      {logoError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch Deck (PDF)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-xl border border-blue-200 transition">
                    {deckUploading ? "Uploading PDF..." : "Upload Pitch Deck (PDF)"}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleDeckUpload}
                      disabled={deckUploading}
                      className="hidden"
                    />
                  </label>
                  {formData.pitch_deck_url && (
                    <a
                      href={formData.pitch_deck_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline font-medium hover:text-blue-800"
                    >
                      View Current Deck ↗
                    </a>
                  )}
                </div>
                {deckError && (
                  <p className="text-xs text-red-600 font-medium">{deckError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Industry Domains */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Industry Sectors & Tags
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Popular Sectors
              </label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_DOMAINS.map((domainName) => {
                  const isSelected = domains.includes(domainName);
                  return (
                    <button
                      key={domainName}
                      type="button"
                      onClick={() => togglePredefinedDomain(domainName)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {isSelected ? `✓ ${domainName}` : `+ ${domainName}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domains (Type & Press Enter)
              </label>
              <div className="w-full border border-gray-300 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 transition bg-white">
                {domains.map((domain, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-800 border border-blue-100 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => removeDomainItem(index)}
                      className="ml-2 text-blue-600 hover:text-blue-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={handleAddDomain}
                  className="flex-1 min-w-[150px] outline-none bg-transparent"
                  placeholder="e.g. SaaS, FinTech..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Deal Terms & Financial Traction (Shark Tank Evaluator) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                3. Deal Terms & Financial Traction 🦈
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Detailed metrics used by the Shark Tank AI Deal Evaluator.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
              AI Evaluator Ready
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Deal Terms Sub-Block */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">
                Shark Tank Pitch Offer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ask Amount ($)
                  </label>
                  <input
                    type="number"
                    name="ask_amount"
                    step="any"
                    value={formData.ask_amount}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 250000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equity Offered (%)
                  </label>
                  <input
                    type="number"
                    name="equity_offered"
                    step="any"
                    min="0"
                    max="100"
                    value={formData.equity_offered}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Implied Valuation ($)
                  </label>
                  <input
                    type="number"
                    name="implied_valuation"
                    step="any"
                    value={formData.implied_valuation}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-emerald-700"
                    placeholder="Auto-calculated (Ask / Equity%)"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Auto-calculated from Ask & Equity
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use of Funds
                </label>
                <input
                  type="text"
                  name="use_of_funds"
                  value={formData.use_of_funds}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. 50% Engineering, 30% Marketing, 20% Inventory"
                />
              </div>
            </div>

            {/* Traction & Financial Metrics Sub-Block */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">
                Financials & Growth
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Revenue (MRR $)
                  </label>
                  <input
                    type="number"
                    name="mrr"
                    step="any"
                    value={formData.mrr}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MoM Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    name="growth_rate_pct"
                    step="any"
                    value={formData.growth_rate_pct}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Margin (%)
                  </label>
                  <input
                    type="number"
                    name="gross_margin_pct"
                    step="any"
                    value={formData.gross_margin_pct}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 75"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Burn Rate ($)
                  </label>
                  <input
                    type="number"
                    name="burn_rate"
                    step="any"
                    value={formData.burn_rate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 8000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Runway (Months)
                  </label>
                  <input
                    type="number"
                    name="runway_months"
                    value={formData.runway_months}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Capital Raised ($)
                  </label>
                  <input
                    type="number"
                    name="total_raised"
                    step="any"
                    value={formData.total_raised}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>
            </div>

            {/* Competition & Moat Sub-Block */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">
                Competitive Landscape & Moat
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Competitors
                  </label>
                  <input
                    type="text"
                    name="main_competitors"
                    value={formData.main_competitors}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. CompetitorA, CompetitorB, Legacy Solutions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Defensibility / Moat Description
                  </label>
                  <textarea
                    name="moat_description"
                    rows="3"
                    value={formData.moat_description}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="What prevents competitors from copying you? (Network effects, proprietary IP, patents, high switching costs...)"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Team */}
        <div id="team" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                4. Team & Co-Founders 👥
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tag active platform users and assign their team roles.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full">
              {teamMembers.length + 1} Member{teamMembers.length > 0 ? "s" : ""} (You + Teammates)
            </span>
          </div>
          <div className="p-6 space-y-6">
            {/* User Search Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Search Teammates by Name or Email
              </label>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Type name or email (e.g. Alex, sarah@example.com)..."
              />
              {searchingUsers && (
                <div className="absolute right-3 top-10 text-xs text-gray-400">
                  Searching...
                </div>
              )}

              {/* Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-50">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full text-left p-3 hover:bg-blue-50 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {(user.name || user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {user.name || "Unnamed User"}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded-lg">
                        + Tag Teammate
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tagged Teammates List */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Linked Team Members ({teamMembers.length})
              </h3>
              {teamMembers.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400 bg-gray-50">
                  No additional teammates tagged yet. Search above to link co-founders or advisors!
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member, idx) => (
                    <div
                      key={member.user_id}
                      className="p-4 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {(member.name || member.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-gray-600">Assigned Role:</label>
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => handleUpdateRole(idx, e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none w-36"
                            placeholder="e.g. CTO, Co-Founder"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          Remove ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-gray-600 hover:bg-gray-100 font-medium rounded-xl mr-4 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition shadow-sm ${saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
