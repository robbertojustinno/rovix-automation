"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, LockKeyhole, Terminal } from "lucide-react";
import { WaitlistForm } from "./waitlist-form";

type Language = "pt" | "en";
const copy = {
  pt: {
    nav: ["Livro", "Dossiês", "Protocolo", "ORPHEUS"], eyebrow: "ARQUIVO 00 // SINAL DETECTADO",
    title: <>Toda verdade<br />deixa um <em>rastro.</em></>,
    intro: "Blake Langmere enterrou o passado dentro de uma caixa. Agora, alguém decidiu abri-la.",
    enter: "Abrir o arquivo", classified: "ACESSO RESTRITO", active: "PROTOCOLO ATIVO",
    bookKicker: "01 / O LIVRO", bookTitle: "O passado não cabe mais numa caixa.",
    bookText: "Uma caixa esquecida, uma presença que conhece detalhes demais e uma operação que nunca terminou. Para proteger a família, Blake terá de seguir rastros que tentou apagar.",
    bookTag: "THRILLER · ESPIONAGEM · CONSPIRAÇÃO DIGITAL", subject: "DOSSIÊ", status: "ARQUIVO CLASSIFICADO",
    blake: "O passado que ele enterrou acaba de ser encontrado.",
    evelyn: "Cada detalhe é uma pista. Cada silêncio, uma escolha.",
    gordon: "Um aliado estratégico com acesso parcial ao protocolo.",
    lara: "Ela conhece Blake melhor do que qualquer arquivo.",
    protocolKicker: "06 / ARQUIVO RESTRITO", protocolTitle: "Protocolo Orpheus",
    protocolText: "Alguns registros só fazem sentido depois da última página. A investigação continua no universo ORPHEUS.",
    appKicker: "07 / EXPERIÊNCIA DIGITAL", appTitle: "A história continua no ORPHEUS.",
    appText: "Explore o terminal, consulte dossiês e resolva enigmas com pistas encontradas no livro.",
    appFeature: "Terminal próprio · dossiês · enigmas",
    appAvailability: "O instalador ainda não está disponível neste portal. Cadastre-se para receber o aviso de liberação.",
    notify: "Avisar quando estiver disponível", listTitle: "Receba o primeiro sinal.",
    listText: "Novidades do livro e o aviso de liberação do ORPHEUS.",
  },
  en: {
    nav: ["Book", "Dossiers", "Protocol", "ORPHEUS"], eyebrow: "FILE 00 // SIGNAL DETECTED",
    title: <>Every truth<br />leaves a <em>trace.</em></>,
    intro: "Blake Langmere buried his past inside a box. Now someone has decided to open it.",
    enter: "Open the file", classified: "RESTRICTED ACCESS", active: "PROTOCOL ACTIVE",
    bookKicker: "01 / THE BOOK", bookTitle: "The past no longer fits in a box.",
    bookText: "A forgotten box, someone who knows too much, and an operation that never ended. To protect his family, Blake must follow the traces he tried to erase.",
    bookTag: "THRILLER · ESPIONAGE · DIGITAL CONSPIRACY", subject: "DOSSIER", status: "CLASSIFIED FILE",
    blake: "The past he buried has just been found.",
    evelyn: "Every detail is a clue. Every silence, a choice.",
    gordon: "A strategic ally with partial access to the protocol.",
    lara: "She knows Blake better than any file ever could.",
    protocolKicker: "06 / RESTRICTED FILE", protocolTitle: "The Orpheus Protocol",
    protocolText: "Some records only make sense after the final page. The investigation continues in the ORPHEUS universe.",
    appKicker: "07 / DIGITAL EXPERIENCE", appTitle: "The story continues in ORPHEUS.",
    appText: "Explore the terminal, consult dossiers, and solve puzzles using clues found in the book.",
    appFeature: "Dedicated terminal · dossiers · puzzles",
    appAvailability: "The installer is not yet available on this portal. Join the list to receive its release notice.",
    notify: "Notify me when available", listTitle: "Receive the first signal.",
    listText: "Book updates and the ORPHEUS release notice.",
  },
};
const people = [
  { id: "blake", name: "Blake Langmere", image: "https://cipher-protocolo-orpheus.norcrj.chatgpt.site/blake.png", number: "02" },
  { id: "evelyn", name: "Evelyn Cross", image: "https://cipher-protocolo-orpheus.norcrj.chatgpt.site/evelyn.png", number: "03" },
  { id: "gordon", name: "Gordon Sullivan", image: "https://cipher-protocolo-orpheus.norcrj.chatgpt.site/gordon.png", number: "04" },
  { id: "lara", name: "Lara Langmere", image: "https://cipher-protocolo-orpheus.norcrj.chatgpt.site/lara.png", number: "05" },
] as const;

export default function OrpheusPortal() {
  const [language, setLanguage] = useState<Language>("pt");
  useEffect(() => { document.documentElement.lang = language === "pt" ? "pt-BR" : "en"; }, [language]);
  const t = copy[language];
  return <div className="cipherPortal">
    <section className="hero" id="inicio">
      <nav className="nav shell" aria-label={language === "pt" ? "Navegação principal" : "Main navigation"}>
        <a className="wordmark" href="#inicio" aria-label="CIPHER — home">CI<span>PH</span>ER</a>
        <div className="nav-links"><a href="#livro">{t.nav[0]}</a><a href="#blake">{t.nav[1]}</a><a href="#protocolo">{t.nav[2]}</a><a href="#orpheus">{t.nav[3]}</a></div>
        <div className="language-switch" aria-label="Language"><button className={language === "pt" ? "selected" : ""} onClick={() => setLanguage("pt")} aria-pressed={language === "pt"}>PT</button><span>/</span><button className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button></div>
      </nav>
      <div className="hero-grid shell"><div className="hero-copy"><p className="eyebrow"><span className="status-dot" />{t.eyebrow}</p><h1>{t.title}</h1><p className="lede">{t.intro}</p><div className="hero-actions"><a className="button-primary" href="#livro">{t.enter} <ArrowDown size={17} /></a><a className="button-quiet" href="#orpheus">ORPHEUS <ArrowUpRight size={16} /></a></div></div></div>
      <div className="hero-footer shell" aria-hidden="true"><span>CIPHER // 001</span><span>{t.classified}</span><span>{t.active}</span></div>
    </section>
    <section className="book-section section shell" id="livro"><div className="book-art"><img src="https://cipher-protocolo-orpheus.norcrj.chatgpt.site/cover.jpg" alt={language === "pt" ? "Capa oficial de CIPHER — Protocolo Orpheus" : "Official cover of CIPHER — The Orpheus Protocol"} /></div><div className="book-copy"><p className="section-index">{t.bookKicker}</p><h2>{t.bookTitle}</h2><p>{t.bookText}</p><div className="book-meta"><span>{t.bookTag}</span><span>ROBERTO JUSTINO</span></div></div></section>
    <div id="dossies">{people.map((person, index) => <section className={`person-section section ${index % 2 ? "reverse" : ""}`} id={person.id} key={person.id}><div className="shell person-grid"><div className="person-art"><img src={person.image} alt={`${t.subject}: ${person.name}`} loading="lazy" /></div><div className="person-copy"><p className="section-index">{person.number} / {t.subject}</p><h2>{person.name}</h2><p>{t[person.id]}</p><span className="file-rule">{t.status} <span>━━━━━━━━━━</span> {person.number}</span></div></div></section>)}</div>
    <section className="protocol-section section" id="protocolo"><div className="shell person-grid"><div className="person-art"><img src="https://cipher-protocolo-orpheus.norcrj.chatgpt.site/protocol.png" alt={t.protocolTitle} loading="lazy" /></div><div className="person-copy"><p className="section-index">{t.protocolKicker}</p><h2>{t.protocolTitle}</h2><p>{t.protocolText}</p><span className="red-stamp"><LockKeyhole size={16} /> {t.classified}</span></div></div></section>
    <section className="orpheus-section section" id="orpheus"><div className="shell orpheus-grid"><div className="terminal-window" aria-hidden="true"><div className="terminal-bar"><span /><span /><span /><b>ORPHEUS://TERMINAL</b></div><div className="terminal-body"><p><span>›</span> whoami</p><p className="terminal-response">USER DETECTED</p><p><span>›</span> mission --status</p><p className="terminal-response">FILE 01 // AWAITING READER</p><p><span>›</span> open dossier/blake</p><p className="cursor-line">_</p></div></div><div className="orpheus-copy"><p className="section-index">{t.appKicker}</p><h2>{t.appTitle}</h2><p>{t.appText}</p><div className="app-feature"><Terminal size={18} /> {t.appFeature}</div><p className="availability">{t.appAvailability}</p><a className="button-primary" href="#lista">{t.notify} <ArrowDown size={16} /></a></div></div></section>
    <section className="waitlist section" id="lista"><div className="shell waitlist-grid"><div><p className="section-index">ORPHEUS // SIGNAL</p><h2>{t.listTitle}</h2><p className="waitlist-copy">{t.listText}</p></div><WaitlistForm language={language} /></div></section>
    <footer><div className="shell footer-grid"><a className="wordmark" href="#inicio">CI<span>PH</span>ER</a><p>© 2026 Roberto Justino da Silva Junior</p><p>PROTOCOLO ORPHEUS</p></div></footer>
  </div>;
}
