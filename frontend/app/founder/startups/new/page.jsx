"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

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
  });

  // Specialized states for arrays
  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [coFounderEmails, setCoFounderEmails] = useState([]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/startups/logo-upload", formData, {
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
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/startups/pitch-deck-upload", formData, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/startups", {
        ...formData,
        domains,
        co_founder_emails: coFounderEmails,
      });
      router.push("/founder/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create startup.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Create Company Profile
        </h1>
        <p className="text-gray-500 mt-2">
          Provide the details investors need to evaluate your startup.
        </p>
      </div>

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
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Explain the problem, your solution, and your market..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 2: Market & Funding */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Market & Funding
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
                  Funding Needed
                </label>
                <input
                  type="text"
                  name="funding_needed"
                  value={formData.funding_needed}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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

        {/* Section 3: Team */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              3. Team (Optional)
            </h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Co-Founders by Email (Press Enter to add)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              If they have an account on this platform, they will be
              automatically linked to this startup.
            </p>
            <div className="w-full border border-gray-300 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 transition bg-white">
              {coFounderEmails.map((email, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() =>
                      removeArrayItem(
                        setCoFounderEmails,
                        coFounderEmails,
                        index,
                      )
                    }
                    className="ml-2 text-gray-500 hover:text-gray-900"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddEmail}
                className="flex-1 min-w-[200px] outline-none bg-transparent"
                placeholder="founder@acme.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Note: Co-founders must have an active Foundry account to be linked. You can add them anytime later from the Edit Startup page once they sign up!
            </p>
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
