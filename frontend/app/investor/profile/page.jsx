"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import BackButton from "@/components/BackButton";

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    linkedin_url: "",
    preferred_stage: "",
  });
  const [focusDomains, setFocusDomains] = useState([]);
  const [domainInput, setDomainInput] = useState("");

  // Fetch the user's current profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/me");
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          linkedin_url: data.linkedin_url || "",
          preferred_stage: data.preferred_stage || "",
        });
        setFocusDomains(data.focus_domains || []);
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load profile data." });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await api.put("/users/me", {
        ...formData,
        focus_domains: focusDomains,
      });
      toast.success("Investor profile updated successfully!");
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to update profile.";
      setMessage({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newDomain = domainInput.trim().replace(",", "");
      if (newDomain && !focusDomains.includes(newDomain)) {
        setFocusDomains([...focusDomains, newDomain]);
      }
      setDomainInput("");
    }
  };

  const removeDomain = (indexToRemove) => {
    setFocusDomains(focusDomains.filter((_, index) => index !== indexToRemove));
  };

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4 p-8 max-w-3xl mx-auto">
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 bg-slate-200 rounded"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-2 bg-slate-200 rounded col-span-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <BackButton href="/investor/dashboard" label="Back to Dashboard" />
      </div>

      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Personal Profile
        </h1>
        <p className="text-gray-500 mt-2">
          Manage your public persona and contact information.
        </p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-xl shadow-sm font-medium border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Me (Bio)
            </label>
            <textarea
              name="bio"
              rows="5"
              value={formData.bio}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
              placeholder="Tell us about your background, experience, and what you are looking for..."
            ></textarea>
            <p className="text-xs text-gray-500 mt-2">
              This will be visible to other users on the platform.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Stage
            </label>
            <select
              name="preferred_stage"
              value={formData.preferred_stage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">No preference</option>
              <option value="idea">Idea / Concept</option>
              <option value="mvp">MVP Developed</option>
              <option value="traction">Early Traction</option>
              <option value="scaling">Scaling / Growth</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Domains (Press Enter to add)
            </label>
            <div className="w-full border border-gray-300 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 transition bg-white">
              {focusDomains.map((domain, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                >
                  {domain}
                  <button
                    type="button"
                    onClick={() => removeDomain(index)}
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
                placeholder="e.g. SaaS, AI, FinTech"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition shadow-sm ${
              saving
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
