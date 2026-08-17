"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BackButton from "@/components/BackButton";

export default function CreateStartup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  // Specialized states for arrays
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

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  // Handle hitting "Enter" or "Comma" to add a domain tag
  const handleAddDomain = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newDomain = domainInput.trim().replace(",", "");
      if (newDomain && !domains.includes(newDomain)) {
        setDomains([...domains, newDomain]);
      }
      setDomainInput("");
    }
  };

  // Handle hitting "Enter" to add a co-founder email
  const handleAddEmail = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newEmail = emailInput.trim().replace(",", "");
      if (
        newEmail &&
        !coFounderEmails.includes(newEmail) &&
        newEmail.includes("@")
      ) {
        setCoFounderEmails([...coFounderEmails, newEmail]);
      }
      setEmailInput("");
    }
  };

  const removeArrayItem = (setter, stateArray, indexToRemove) => {
    setter(stateArray.filter((_, index) => index !== indexToRemove));
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
      toast.success("Logo uploaded successfully!");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to upload logo. Try again.";
      setLogoError(msg);
      toast.error(msg);
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
      toast.success("Pitch deck uploaded successfully!");
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to upload pitch deck. Try again.";
      setDeckError(msg);
      toast.error(msg);
    } finally {
      setDeckUploading(false);
    }
  };

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        ask_amount: formData.ask_amount ? parseFloat(formData.ask_amount) : null,
        equity_offered: formData.equity_offered ? parseFloat(formData.equity_offered) : null,
        implied_valuation: formData.implied_valuation ? parseFloat(formData.implied_valuation) : null,
        mrr: formData.mrr ? parseFloat(formData.mrr) : null,
        growth_rate_pct: formData.growth_rate_pct ? parseFloat(formData.growth_rate_pct) : null,
        burn_rate: formData.burn_rate ? parseFloat(formData.burn_rate) : null,
        runway_months: formData.runway_months ? parseInt(formData.runway_months, 10) : null,
        gross_margin_pct: formData.gross_margin_pct ? parseFloat(formData.gross_margin_pct) : null,
        total_raised: formData.total_raised ? parseFloat(formData.total_raised) : null,
        domains,
        team_members: teamMembers.map((m) => ({
          user_id: m.user_id,
          role: m.role || "cofounder",
        })),
      };

      await api.post("/startups", payload);
      toast.success("Startup profile created successfully! Redirecting...");
      setSuccess("✓ Startup profile created successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/founder/dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create startup.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <BackButton href="/founder/startups" label="Back to Startups" />
      </div>

      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Create Company Profile
        </h1>
        <p className="text-gray-500 mt-2">
          Provide the details investors need to evaluate your startup.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex gap-3">
          <span className="text-2xl shrink-0">🛡️</span>
          <div>
            <h3 className="text-sm font-bold text-blue-950">
              Admin Verification & AI Valuation Workflow
            </h3>
            <p className="text-xs text-blue-800/90 mt-1 leading-relaxed">
              Once submitted, your company profile will be reviewed by the platform administrators and processed by our AI Deal Evaluator. After approval, you can update operational metrics (MRR, burn rate, runway) instantly, while changes to sensitive details (company name, pitch deck, equity/deal terms) will undergo quick admin re-verification.
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl shadow-sm font-medium flex items-center">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              1. Core Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="https://acme.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="https://acme.com/logo.png"
              />
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Or upload a logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoUploading && (
                  <p className="text-xs text-gray-500">Uploading logo...</p>
                )}
                {logoError && (
                  <p className="text-xs text-red-600">{logoError}</p>
                )}
                {formData.logo_url && !logoUploading && (
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch Deck URL
              </label>
              <input
                type="url"
                name="pitch_deck_url"
                value={formData.pitch_deck_url}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="https://acme.com/deck.pdf"
              />
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Or upload Pitch Deck (PDF / Presentation)
                </label>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx,image/*"
                  onChange={handleDeckUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {deckUploading && (
                  <p className="text-xs text-gray-500">Uploading pitch deck...</p>
                )}
                {deckError && (
                  <p className="text-xs text-red-600">{deckError}</p>
                )}
                {formData.pitch_deck_url && !deckUploading && (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ Pitch Deck Attached: {formData.pitch_deck_url}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                One-Line Pitch *
              </label>
              <input
                required
                type="text"
                name="tagline"
                maxLength={120}
                value={formData.tagline}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="What do you do in 10 words or less?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                placeholder="Explain the problem, your solution, and your market..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 2: Market & Stage */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Market & Stage
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stage *
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="idea">Idea / Concept</option>
                  <option value="mvp">MVP Developed</option>
                  <option value="traction">Early Traction</option>
                  <option value="scaling">Scaling / Growth</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Target Summary
                </label>
                <input
                  type="text"
                  name="funding_needed"
                  value={formData.funding_needed}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. $500k Pre-Seed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Domains (Press Enter to add)
              </label>
              <div className="w-full border border-gray-300 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 transition bg-white">
                {domains.map((domain, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayItem(setDomains, domains, index)
                      }
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

        {/* Section 3: Deal Terms & Financial Traction (AI Valuation Engine) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                3. Deal Terms & Financial Traction 📊
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Detailed metrics used by the AI Venture Valuation Engine.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
              AI Valuation Ready
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Deal Terms Sub-Block */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">
                Capital Structure & Pitch Terms
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="What prevents competitors from copying you? (Network effects, proprietary IP, patents, high switching costs...)"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Team */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                4. Team & Co-Founders (Optional) 👥
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search and tag active Foundry users to link them as team members with custom roles.
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
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
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
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition shadow-sm ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {loading ? "Saving Profile..." : "Submit Startup"}
          </button>
        </div>
      </form>
    </div>
  );
}
