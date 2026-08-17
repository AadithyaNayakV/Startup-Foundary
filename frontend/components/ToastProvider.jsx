"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      containerStyle={{
        top: 24,
        right: 24,
        zIndex: 99999,
      }}
      toastOptions={{
        duration: 4500,
        style: {
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "12px 18px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
          style: {
            border: "1px solid #a7f3d0",
            background: "#ffffff",
            color: "#065f46",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            border: "1px solid #fecaca",
            background: "#ffffff",
            color: "#991b1b",
          },
        },
      }}
    />
  );
}
