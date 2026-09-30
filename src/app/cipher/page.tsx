import type { Metadata } from "next";
import OrpheusPortal from "../orpheus/orpheus-client";
import "../orpheus/portal.css";

export const metadata: Metadata = {
  title: "CIPHER — Protocolo Orpheus | Roberto Justino",
  description: "Entre no universo de CIPHER — Protocolo Orpheus. Conheça o livro, os dossiês e compre as edições oficiais.",
  alternates: { canonical: "/cipher/" },
};
export default function CipherPage(){ return <OrpheusPortal />; }
