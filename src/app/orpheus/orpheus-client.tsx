"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, KeyRound, LockKeyhole, ShieldCheck, Terminal, BookOpen, MonitorDown } from "lucide-react";
import styles from "./page.module.css";

type Lang = "en" | "pt";

const text = {
  en: {
    access: "CIPHER // RESTRICTED ACCESS",
    protocol: "PROTOCOL ORPHEUS",
    title: "The story does not end on the final page.",
    lead1: "ORPHEUS is the official interactive companion to ",
    book: "CIPHER: The Orpheus Protocol",
    lead2: ". Investigate files, use the controlled terminal, unlock dossiers and solve challenges that depend on details hidden inside the book.",
    download: "Download ORPHEUS for Windows",
    preparing: "Windows installer being prepared",
    permanent: "This address is permanent. Future ORPHEUS updates will be published here.",
    node: "ORPHEUS // ACCESS NODE",
    online: "CORE ONLINE",
    ready: "NARRATIVE LAYER READY",
    required: "BOOK ACCESS REQUIRED",
    f1: "Controlled Terminal",
    f1p: "Use ORPHEUS commands, history and autocomplete without exposing a system shell.",
    f2: "Book-Linked Challenges",
    f2p: "Some answers can only be discovered by readers who paid attention to the story.",
    f3: "Progressive Access",
    f3p: "Dossiers, clues and narrative layers unlock as you advance through the experience.",
    f4: "Local-First Privacy",
    f4p: "Identity and narrative progress are handled separately, with no arbitrary shell access.",
    auth: "READER AUTHORIZATION",
    key: "Your book is part of the key.",
    keyp1: "Keep your copy of ",
    keyp2: " nearby. ORPHEUS may ask for information, codes or clues that exist only inside the story. Do not share puzzle answers publicly.",
    architecture: "Activation architecture",
    architecturep: "Book-linked authorization · signed license ready · no purchase-email collection required",
    footer: "Created by Roberto Justino · Technology by ROVIX Automation",
    langLabel: "Português"
  },
  pt: {
    access: "CIPHER // ACESSO RESTRITO",
    protocol: "PROTOCOLO ORPHEUS",
    title: "A história não termina na última página.",
    lead1: "ORPHEUS é a experiência interativa oficial de ",
    book: "CIPHER: Protocolo Orpheus",
    lead2: ". Investigue arquivos, use o terminal controlado, desbloqueie dossiês e resolva desafios que dependem de detalhes escondidos no livro.",
    download: "Baixar ORPHEUS para Windows",
    preparing: "Instalador do Windows em preparação",
    permanent: "Este endereço é permanente. As próximas versões do ORPHEUS serão publicadas aqui.",
    node: "ORPHEUS // NÓ DE ACESSO",
    online: "NÚCLEO ONLINE",
    ready: "CAMADA NARRATIVA PRONTA",
    required: "ACESSO PELO LIVRO NECESSÁRIO",
    f1: "Terminal Controlado",
    f1p: "Use comandos do ORPHEUS, histórico e preenchimento automático sem expor um shell do sistema.",
    f2: "Desafios Ligados ao Livro",
    f2p: "Algumas respostas só podem ser descobertas por leitores atentos à história.",
    f3: "Acesso Progressivo",
    f3p: "Dossiês, pistas e camadas narrativas são liberados conforme você avança na experiência.",
    f4: "Privacidade Local",
    f4p: "Identidade e progresso narrativo são tratados separadamente, sem acesso arbitrário ao shell.",
    auth: "AUTORIZAÇÃO DO LEITOR",
    key: "Seu livro faz parte da chave.",
    keyp1: "Mantenha sua cópia de ",
    keyp2: " por perto. O ORPHEUS pode pedir informações, códigos ou pistas que existem somente dentro da história. Não compartilhe publicamente as respostas dos enigmas.",
    architecture: "Arquitetura de ativação",
    architecturep: "Autorização ligada ao livro · licença assinada preparada · sem exigir e-mail de compra",
    footer: "Criado por Roberto Justino · Tecnologia por ROVIX Automation",
    langLabel: "English"
  }
};

export default function OrpheusClient({ downloadUrl, version }: { downloadUrl: string; version: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = text[lang];
  const available = downloadUrl.trim().length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.scan} aria-hidden="true" />
      <div className={styles.languageBar}>
        <button onClick={() => setLang(lang === "en" ? "pt" : "en")} type="button">
          {t.langLabel}
        </button>
      </div>

      <section className={styles.hero}>
        <div className={styles.eyebrow}>{t.access}</div>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className={styles.protocol}>{t.protocol}</p>
            <h1>{t.title}</h1>
            <p className={styles.lead}>
              {t.lead1}<strong>{t.book}</strong>{t.lead2}
            </p>

            <div className={styles.actions}>
              {available ? (
                <a className={styles.primary} href={downloadUrl}>
                  <Download size={19} /> {t.download}
                </a>
              ) : (
                <span className={styles.primaryDisabled} aria-disabled="true">
                  <MonitorDown size={19} /> {t.preparing}
                </span>
              )}
              <Link className={styles.secondary} href="/">
                ROVIX Automation
              </Link>
            </div>

            <p className={styles.note}>{t.permanent}</p>
          </div>

          <div className={styles.terminal} aria-label="ORPHEUS access terminal preview">
            <div className={styles.terminalTop}>
              <span>{t.node}</span>
              <span>v{version}</span>
            </div>
            <div className={styles.terminalBody}>
              <p><span>&gt;</span> system.status</p>
              <p className={styles.ok}>{t.online}</p>
              <p><span>&gt;</span> protocol.load ORPHEUS</p>
              <p className={styles.ok}>{t.ready}</p>
              <p><span>&gt;</span> authorization</p>
              <p className={styles.warn}>{t.required}</p>
              <div className={styles.cursor}>_</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <article><Terminal/><h2>{t.f1}</h2><p>{t.f1p}</p></article>
        <article><BookOpen/><h2>{t.f2}</h2><p>{t.f2p}</p></article>
        <article><LockKeyhole/><h2>{t.f3}</h2><p>{t.f3p}</p></article>
        <article><ShieldCheck/><h2>{t.f4}</h2><p>{t.f4p}</p></article>
      </section>

      <section className={styles.access}>
        <div>
          <span className={styles.kicker}>{t.auth}</span>
          <h2>{t.key}</h2>
          <p>{t.keyp1}<strong>{t.book}</strong>{t.keyp2}</p>
        </div>
        <div className={styles.accessCard}>
          <KeyRound />
          <div><strong>{t.architecture}</strong><span>{t.architecturep}</span></div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>ORPHEUS — CIPHER Interactive Experience</span>
        <span>{t.footer}</span>
      </footer>
    </main>
  );
}
