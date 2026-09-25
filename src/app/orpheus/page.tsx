import type { Metadata } from "next";
import Link from "next/link";
import { Download, KeyRound, LockKeyhole, ShieldCheck, Terminal, BookOpen, MonitorDown } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "ORPHEUS — CIPHER Interactive Experience",
  description: "Official companion experience for CIPHER: The Orpheus Protocol. Download the Windows application and continue the investigation beyond the book.",
  alternates: { canonical: "/orpheus" },
};

const downloadUrl = process.env.ORPHEUS_DOWNLOAD_URL ?? process.env.NEXT_PUBLIC_ORPHEUS_DOWNLOAD_URL ?? "";
const version = process.env.ORPHEUS_VERSION ?? "0.7.0";

export default function OrpheusAccess() {
  const available = downloadUrl.trim().length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.scan} aria-hidden="true" />
      <section className={styles.hero}>
        <div className={styles.eyebrow}>CIPHER // RESTRICTED ACCESS</div>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className={styles.protocol}>PROTOCOL ORPHEUS</p>
            <h1>The story does not end on the final page.</h1>
            <p className={styles.lead}>
              ORPHEUS is the official interactive companion to <strong>CIPHER: The Orpheus Protocol</strong>.
              Investigate files, use the controlled terminal, unlock dossiers and solve challenges that depend on
              details hidden inside the book.
            </p>

            <div className={styles.actions}>
              {available ? (
                <a className={styles.primary} href={downloadUrl}>
                  <Download size={19} /> Download ORPHEUS for Windows
                </a>
              ) : (
                <span className={styles.primaryDisabled} aria-disabled="true">
                  <MonitorDown size={19} /> Windows installer being prepared
                </span>
              )}
              <Link className={styles.secondary} href="/">
                ROVIX Automation
              </Link>
            </div>

            <p className={styles.note}>
              This address is permanent. Future ORPHEUS updates will be published here.
            </p>
          </div>

          <div className={styles.terminal} aria-label="ORPHEUS access terminal preview">
            <div className={styles.terminalTop}>
              <span>ORPHEUS // ACCESS NODE</span>
              <span>v{version}</span>
            </div>
            <div className={styles.terminalBody}>
              <p><span>&gt;</span> system.status</p>
              <p className={styles.ok}>CORE ONLINE</p>
              <p><span>&gt;</span> protocol.load ORPHEUS</p>
              <p className={styles.ok}>NARRATIVE LAYER READY</p>
              <p><span>&gt;</span> authorization</p>
              <p className={styles.warn}>BOOK ACCESS REQUIRED</p>
              <div className={styles.cursor}>_</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <article>
          <Terminal />
          <h2>Controlled Terminal</h2>
          <p>Use ORPHEUS commands, history and autocomplete without exposing a system shell.</p>
        </article>
        <article>
          <BookOpen />
          <h2>Book-Linked Challenges</h2>
          <p>Some answers can only be discovered by readers who paid attention to the story.</p>
        </article>
        <article>
          <LockKeyhole />
          <h2>Progressive Access</h2>
          <p>Dossiers, clues and narrative layers unlock as you advance through the experience.</p>
        </article>
        <article>
          <ShieldCheck />
          <h2>Local-First Privacy</h2>
          <p>Identity and narrative progress are handled separately, with no arbitrary shell access.</p>
        </article>
      </section>

      <section className={styles.access}>
        <div>
          <span className={styles.kicker}>READER AUTHORIZATION</span>
          <h2>Your book is part of the key.</h2>
          <p>
            Keep your copy of <strong>CIPHER: The Orpheus Protocol</strong> nearby. ORPHEUS may ask for information,
            codes or clues that exist only inside the story. Do not share puzzle answers publicly.
          </p>
        </div>
        <div className={styles.accessCard}>
          <KeyRound />
          <div>
            <strong>Activation architecture</strong>
            <span>Book-linked authorization · signed license ready · no purchase-email collection required</span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>ORPHEUS — CIPHER Interactive Experience</span>
        <span>Created by Roberto Justino · Technology by ROVIX Automation</span>
      </footer>
    </main>
  );
}
