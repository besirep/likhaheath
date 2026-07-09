import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", confirmColor = "#2a9d8f", isDestructive = false }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 16, width: 400, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <style>{`@keyframes popIn { from{transform:scale(0.93);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
        
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #edf1f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isDestructive ? <AlertTriangle size={20} color="#ef4444" /> : <AlertTriangle size={20} color={confirmColor} />}
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e2d40" }}>{title}</h2>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a9bb0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: "24px 24px 32px" }}>
          <p style={{ margin: 0, fontSize: 15, color: "#4a5d75", lineHeight: 1.5 }}>{message}</p>
        </div>
        
        <div style={{ padding: "16px 24px", background: "#f8fdfc", borderTop: "1px solid #edf1f7", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onCancel} style={{ background: "white", border: "1px solid #e0e7ef", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#4a5d75", cursor: "pointer" }}>
            {cancelText}
          </button>
          <button onClick={onConfirm} style={{ background: isDestructive ? "#ef4444" : confirmColor, color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 12px ${isDestructive ? "rgba(239,68,68,0.2)" : "rgba(42,157,143,0.2)"}` }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
