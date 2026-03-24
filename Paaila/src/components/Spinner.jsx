import React from "react";
import "../App.css";

export default function Spinner({ label = "Loading..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div className="spinner" style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: "var(--muted2)" }}>{label}</div>
    </div>
  );
}
