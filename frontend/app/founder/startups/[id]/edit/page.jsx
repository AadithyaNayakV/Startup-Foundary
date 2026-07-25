"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function EditStartup({ params }) {
  const { id } = params;
  const router = useRouter();
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
  });

  const [domainInput, setDomainInput] = useState("");
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    const loadStartup = async () => {
      try {
        const { data } = await api.get(`/startups/${id}`);
        setFormData({
          name: data.name || "",
          tagline: data.tagline || "",
          description: data.description || "",
          stage: data.stage || "idea",
          funding_needed: data.funding_needed || "",
          website_url: data.website_url || "",
          logo_url: data.logo_url || "",
          pitch_deck_url: data.pitch_deck_url || "",
        });
        setDomains(data.domains || []);
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
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleAddDomain = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const newDomain = domainInput.trim().replace(",", "");
      if (newDomain && !domains.includes(newDomain)) {
        setDomains([...domains, newDomain]);
      }
      setDomainInput("");
    }
  };

  const removeArrayItem = (indexToRemove) => {
    setDomains(domains.filter((_, index) => index !== indexToRemove));
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.put(`/startups/${id}`, {
        ...formData,
        domains,
      });
      router.push(`/founder/startups/${id}`);
      router.refresh();
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center">
          <p>{error}</p>
          <Link
            href={`/founder/startups/${id}`}
            className="text-blue-600 font-semibold mt-4 inline-block"
          >
            Back to startup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Edit Company Profile
        </h1>
        <p className="text-gray-500 mt-2">
          Updates will move your startup back to pending for review.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
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
                  Company Name
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
                One-Line Pitch
              </label>
              <input
                required
                type="text"
                name="tagline"
                maxLength={120}
                value={formData.tagline}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
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
              />
            </div>
          </div>
        </div>

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
                  Current Stage
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
                      onClick={() => removeArrayItem(index)}
                      className="ml-2 text-blue-600 hover:text-blue-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                  onKeyDown={handleAddDomain}
                  className="flex-1 min-w-[150px] outline-none bg-transparent"
                  placeholder="e.g. SaaS, FinTech..."
                />
              </div>
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
            className={`px-8 py-3 rounded-xl font-semibold text-white transition shadow-sm ${
              saving
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
