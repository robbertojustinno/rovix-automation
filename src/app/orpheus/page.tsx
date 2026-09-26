import type { Metadata } from "next";
import OrpheusPortal from "./orpheus-client";
import "./portal.css";

export const metadata: Metadata = { title: "CIPHER — Protocolo Orpheus", description: "Portal oficial de CIPHER — Protocolo Orpheus, de Roberto Justino." };
export default function OrpheusPage() { return <OrpheusPortal />; }
