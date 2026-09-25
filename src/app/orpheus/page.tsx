import type { Metadata } from "next";
import OrpheusClient from "./orpheus-client";

export const metadata: Metadata = {
  title: "ORPHEUS — CIPHER Interactive Experience",
  description: "Official companion experience for CIPHER: The Orpheus Protocol / CIPHER: Protocolo Orpheus.",
  alternates: { canonical: "/orpheus" },
};

const downloadUrl = process.env.ORPHEUS_DOWNLOAD_URL ?? process.env.NEXT_PUBLIC_ORPHEUS_DOWNLOAD_URL ?? "";
const version = process.env.ORPHEUS_VERSION ?? "0.7.0";

export default function OrpheusAccess() {
  return <OrpheusClient downloadUrl={downloadUrl} version={version} />;
}
