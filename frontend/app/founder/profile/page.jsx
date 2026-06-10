"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    linkedin_url: "",
  });

  // Fetch the user's current profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/me");
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          linkedin_url: data.linkedin_url || "",
        });
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
      await api.put("/users/me", formData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4 p-8 max-w-3xl mx-auto"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div></div></div></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Personal Profile</h1>
        <p className="text-gray-500 mt-2">Manage your public persona and contact information.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl shadow-sm font-medium border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
            <input 
              type="url" 
              name="linkedin_url" 
              value={formData.linkedin_url} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="https://linkedin.com/in/yourprofile" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">About Me (Bio)</label>
            <textarea 
              name="bio" 
              rows="5" 
              value={formData.bio} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Tell us about your background, experience, and what you are looking for..."
            ></textarea>
            <p className="text-xs text-gray-500 mt-2">This will be visible to other users on the platform.</p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={saving} 
            className={`px-8 py-3 rounded-xl font-semibold text-white transition shadow-sm ${
              saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}