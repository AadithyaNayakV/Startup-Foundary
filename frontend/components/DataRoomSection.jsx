"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function DataRoomSection({ startupId, isFounder = false }) {
  const [dataRoomState, setDataRoomState] = useState({
    access_granted: false,
    is_founder: false,
    request_status: "none",
    documents: [],
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState("financials");
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get(`/startups/${startupId}/dataroom/documents`);
      setDataRoomState(data);

      if (data.is_founder) {
        const reqData = await api.get(`/startups/${startupId}/dataroom/requests`);
        setRequests(reqData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch data room state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startupId) {
      fetchDocuments();
    }
  }, [startupId]);

  const handleRequestAccess = async () => {
    setSubmittingReq(true);
    setMessage(null);
    try {
      await api.post(`/startups/${startupId}/dataroom/request-access`);
      toast.success("Access request submitted to founder!");
      setMessage({ type: "success", text: "Access request submitted to founder!" });
      await fetchDocuments();
    } catch (err) {
      const msg = err.response?.data?.detail || "Request failed";
      setMessage({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setSubmittingReq(false);
    }
  };

  const [openingDocId, setOpeningDocId] = useState(null);

  const handleViewDocument = async (doc) => {
    try {
      setOpeningDocId(doc.id);
      const { data } = await api.get(`/dataroom/documents/${doc.id}/download-url`);
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else if (doc.file_url) {
        window.open(doc.file_url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to fetch fresh presigned URL:", err);
      if (doc.file_url) {
        window.open(doc.file_url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(err.response?.data?.detail || "Failed to open document");
      }
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      await api.post(`/dataroom/requests/${requestId}/respond`, { status });
      toast.success(`Access request ${status}ed successfully!`);
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to respond to request:", err);
      toast.error(err.response?.data?.detail || "Failed to respond to request");
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("file_type", fileType);

      await api.post(`/startups/${startupId}/dataroom/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Document uploaded to Due Diligence Vault!");
      setMessage({ type: "success", text: "Document uploaded successfully!" });
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err) {
      const msg = err.response?.data?.detail || "Upload failed";
      setMessage({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/dataroom/documents/${docId}`);
      toast.success("Document deleted successfully.");
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
      toast.error(err.response?.data?.detail || "Failed to delete document.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-sm text-gray-500">
        Loading Data Room status...
      </div>
    );
  }

  const { access_granted, request_status, documents } = dataRoomState;
  const isUserFounder = dataRoomState.is_founder || isFounder;

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Due Diligence Data Room 🔒
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Confidential Vault
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Encrypted storage for audited financials, cap tables, patent filings, and legal records.
          </p>
        </div>

        {/* Status Badges for Investor */}
        {!isUserFounder && (
          <div>
            {request_status === "pending" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Access Request Pending Founder Approval
              </span>
            )}
            {request_status === "rejected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                Access Request Denied by Founder
              </span>
            )}
            {request_status === "approved" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Data Room Access Granted
              </span>
            )}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Founder View: Access Request Manager */}
      {isUserFounder && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Investor Access Requests ({requests.length})</span>
            <span className="text-xs text-slate-500 font-normal">
              Review and grant due diligence access
            </span>
          </h3>

          {requests.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No access requests submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900">{req.investor_name || "Investor"}</span>
                    <span className="text-gray-500 ml-2">({req.investor_email})</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Requested: {new Date(req.requested_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {req.status}
                    </span>

                    {req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespondRequest(req.id, "approved")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          Approve ✅
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondRequest(req.id, "rejected")}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition"
                        >
                          Deny ❌
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Founder View: Upload Form */}
      {isUserFounder && (
        <form onSubmit={handleUploadDocument} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Upload Confidential Document 📤</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document Category</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="financials">Financial Model & P&L</option>
                <option value="cap_table">Cap Table & Equity Breakdown</option>
                <option value="patent">IP & Patent Filings</option>
                <option value="other">Legal & Other Records</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {uploading ? "Uploading Document..." : "Upload Document 📤"}
          </button>
        </form>
      )}

      {/* Investor Locked Vault View */}
      {!access_granted && !isUserFounder && (
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-10 rounded-3xl text-center text-white space-y-4 border border-indigo-900/50 shadow-lg">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-white/10 shadow-xs">
            🔒
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Protected Data Room
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This startup's financial statements, cap tables, and legal due diligence files are restricted to approved investors.
            </p>
          </div>

          {request_status === "none" && (
            <button
              type="button"
              onClick={handleRequestAccess}
              disabled={submittingReq}
              className="mt-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-md disabled:opacity-50"
            >
              {submittingReq ? "Submitting Request..." : "Request Access to Data Room 🔑"}
            </button>
          )}
        </div>
      )}

      {/* Document Library List (Visible if Access Granted) */}
      {access_granted && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Vault Documents ({documents.length})
            </h3>
          </div>

          {documents.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center text-xs text-gray-500">
              No documents uploaded to this data room yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const badgeColor =
                  doc.file_type === "financials"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : doc.file_type === "cap_table"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : doc.file_type === "patent"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-gray-100 text-gray-700 border-gray-200";

                return (
                  <div
                    key={doc.id}
                    className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-300 transition shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                          {doc.file_type.replace("_", " ")}
                        </span>
                        {doc.created_at && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-gray-900 text-xs mt-2.5 truncate" title={doc.file_name}>
                        📄 {doc.file_name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(doc)}
                        disabled={openingDocId === doc.id}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {openingDocId === doc.id ? "Opening..." : "View File 📥"}
                      </button>

                      {isUserFounder && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
