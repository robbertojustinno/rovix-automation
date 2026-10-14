"use client";

import { useEffect } from "react";

const destination = "https://o67-opportunity-os.onrender.com/work";

export default function O67Redirect() {
  useEffect(() => { window.location.replace(destination); }, []);
  return (
    <main style={{ padding: "3rem", textAlign: "center" }}>
      <h1>O67 — Radar de trabalho remoto</h1>
      <p>Abrindo suas oportunidades…</p>
      <a href={destination}>Abrir O67</a>
    </main>
  );
}
