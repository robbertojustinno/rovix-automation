"use client";

import { useEffect } from "react";

const destination = "https://o67-opportunity-os.onrender.com/dashboard";

export default function O67Redirect() {
  useEffect(() => { window.location.replace(destination); }, []);
  return (
    <main style={{ padding: "3rem", textAlign: "center" }}>
      <h1>O67 — Opportunity OS</h1>
      <p>Abrindo o dashboard online…</p>
      <a href={destination}>Abrir O67</a>
    </main>
  );
}
