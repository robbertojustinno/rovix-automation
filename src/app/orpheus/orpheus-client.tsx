"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, LockKeyhole, Terminal } from "lucide-react";
import { WaitlistForm } from "./waitlist-form";
import { analytics } from "@/services/commercial";

type Language = "pt" | "en";
const copy = {
  pt: {
    nav: ["Livro", "Comprar", "Dossiês", "Protocolo", "ORPHEUS"], eyebrow: "ARQUIVO 00 // SINAL DETECTADO",
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
    nav: ["Book", "Buy", "Dossiers", "Protocol", "ORPHEUS"], eyebrow: "FILE 00 // SIGNAL DETECTED",
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
  { id: "blake", name: "Blake Langmere", image: "/orpheus/assets/blake.webp", number: "02" },
  { id: "evelyn", name: "Evelyn Cross", image: "/orpheus/assets/evelyn.webp", number: "03" },
  { id: "gordon", name: "Gordon Sullivan", image: "/orpheus/assets/gordon.webp", number: "04" },
  { id: "lara", name: "Lara Langmere", image: "/orpheus/assets/lara.webp", number: "05" },
] as const;

export default function OrpheusPortal() {
  const [language, setLanguage] = useState<Language>("pt");
  const [investigation, setInvestigation] = useState(false);
  useEffect(() => { document.documentElement.lang = language === "pt" ? "pt-BR" : "en"; }, [language]);
  const t = copy[language];
  const track = (event:string, properties:Record<string,unknown>={}) => analytics.track(event,{source:"cipher_funnel",language,...properties});
  const beginInvestigation = () => { setInvestigation(true); track("cipher_investigation_started"); setTimeout(() => document.getElementById("interceptacao")?.scrollIntoView({behavior:"smooth"}), 60); };
  return <div className="cipherPortal">
    <section className="hero" id="inicio">
      <nav className="nav shell" aria-label={language === "pt" ? "Navegação principal" : "Main navigation"}>
        <a className="wordmark" href="#inicio" aria-label="CIPHER — home">CI<span>PH</span>ER</a>
        <div className="nav-links"><a href="#livro">{t.nav[0]}</a><a href="#comprar">{t.nav[1]}</a><a href="#blake">{t.nav[2]}</a><a href="#protocolo">{t.nav[3]}</a><a href="#orpheus">{t.nav[4]}</a></div>
        <div className="language-switch" aria-label="Language"><button className={language === "pt" ? "selected" : ""} onClick={() => setLanguage("pt")} aria-pressed={language === "pt"}>PT</button><span>/</span><button className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button></div>
      </nav>
      <div className="hero-grid shell"><div className="hero-copy"><p className="eyebrow"><span className="status-dot" />{t.eyebrow}</p><h1>{t.title}</h1><p className="lede">{t.intro}</p><div className="hero-actions"><button className="button-primary funnel-trigger" type="button" onClick={beginInvestigation}>{language === "pt" ? "INICIAR INVESTIGAÇÃO" : "BEGIN INVESTIGATION"} <ArrowDown size={17} /></button><a className="button-quiet" href="#comprar" onClick={()=>track("cipher_direct_buy_click")}>{language === "pt" ? "Já quero o livro" : "I want the book"} <ArrowDown size={16} /></a></div><p className="hero-proof">{language === "pt" ? "THRILLER DE ESPIONAGEM · EXPERIÊNCIA TRANSMÍDIA · PT / EN" : "ESPIONAGE THRILLER · TRANSMEDIA EXPERIENCE · PT / EN"}</p></div></div>
      <div className="hero-footer shell" aria-hidden="true"><span>CIPHER // 001</span><span>{t.classified}</span><span>{t.active}</span></div>
    </section>
    <section className={`intercept-section section ${investigation ? "unlocked" : ""}`} id="interceptacao"><div className="shell intercept-grid"><div><p className="section-index">{language === "pt" ? "INTERCEPTAÇÃO // 01" : "INTERCEPT // 01"}</p><h2>{language === "pt" ? "Você encontrou um arquivo que não deveria estar aqui." : "You found a file that should not be here."}</h2><p className="intercept-lede">{language === "pt" ? "Blake Langmere enterrou o passado. Alguém acabou de encontrá-lo." : "Blake Langmere buried his past. Someone just found it."}</p><p className="intercept-question">{language === "pt" ? "A pergunta não é quem encontrou Blake. É por que esperaram tanto tempo." : "The question is not who found Blake. It is why they waited so long."}</p><a className="button-primary" href="#livro" onClick={()=>track("cipher_dossier_opened",{dossier:"blake_entry"})}>{language === "pt" ? "ABRIR DOSSIÊ" : "OPEN DOSSIER"} <ArrowDown size={17}/></a></div><div className="intercept-terminal" aria-hidden="true"><span>ORPHEUS://INTERCEPT</span><b>{investigation ? "ACCESS GRANTED" : "AWAITING AUTHORIZATION"}</b><p>&gt; recover file_001<br/>&gt; subject: BLAKE_LANGMERE<br/>&gt; status: TRACE_DETECTED<br/>&gt; source: UNKNOWN</p><i>_</i></div></div></section>
    <section className="book-section section shell" id="livro"><div className="book-art"><img src="/orpheus/assets/cover.webp" alt={language === "pt" ? "Capa oficial de CIPHER — Protocolo Orpheus" : "Official cover of CIPHER — The Orpheus Protocol"} /></div><div className="book-copy"><p className="section-index">{t.bookKicker}</p><h2>{t.bookTitle}</h2><p>{t.bookText}</p><div className="book-meta"><span>{t.bookTag}</span><span>ROBERTO JUSTINO</span></div></div></section>
    <section className="buy-section section" id="comprar"><div className="shell"><div className="conversion-banner"><span>{language === "pt" ? "A INVESTIGAÇÃO COMEÇA NO LIVRO." : "THE INVESTIGATION BEGINS IN THE BOOK."}</span><strong>{language === "pt" ? "Escolha o idioma. Depois, o formato." : "Choose the language. Then the format."}</strong></div><div className="buy-heading"><div><p className="section-index">{language === "pt" ? "02 / EDIÇÕES OFICIAIS" : "02 / OFFICIAL EDITIONS"}</p><h2>{language === "pt" ? "Escolha sua edição." : "Choose your edition."}</h2></div><p>{language === "pt" ? "CIPHER — Protocolo Orpheus está disponível em português e inglês, nas versões física e Kindle." : "CIPHER — The Orpheus Protocol is available in English and Portuguese, in paperback and Kindle editions."}</p></div>
    <div className="language-edition"><div className="edition-language-title"><span>BR // PORTUGUÊS</span><b>PROTOCOLO ORPHEUS</b></div><div className="edition-grid">
      <article className="edition-card featured"><span className="edition-code">BR // LIVRO FÍSICO</span><h3>CIPHER</h3><p className="edition-subtitle">Protocolo Orpheus</p><div className="edition-meta"><span>PORTUGUÊS</span><span>EDIÇÃO FÍSICA</span></div><a className="edition-buy" href="https://www.amazon.com/dp/6502345670" onClick={()=>track("cipher_amazon_click",{edition:"pt_physical"})} target="_blank" rel="noopener noreferrer">Comprar livro físico <ArrowUpRight size={18}/></a></article>
      <article className="edition-card"><span className="edition-code">BR // KINDLE</span><h3>CIPHER</h3><p className="edition-subtitle">Protocolo Orpheus</p><div className="edition-meta"><span>PORTUGUÊS</span><span>KINDLE</span></div><a className="edition-buy" href="https://www.amazon.com/dp/B0HJ6YC815" onClick={()=>track("cipher_amazon_click",{edition:"pt_kindle"})} target="_blank" rel="noopener noreferrer">Comprar Kindle <ArrowUpRight size={18}/></a></article>
    </div></div>
    <div className="language-edition"><div className="edition-language-title"><span>US // ENGLISH</span><b>THE ORPHEUS PROTOCOL</b></div><div className="edition-grid">
      <article className="edition-card featured"><span className="edition-code">US // PAPERBACK</span><h3>CIPHER</h3><p className="edition-subtitle">The Orpheus Protocol</p><div className="edition-meta"><span>ENGLISH</span><span>PAPERBACK</span></div><a className="edition-buy" href="https://www.amazon.com/dp/B0HL62C1WL" onClick={()=>track("cipher_amazon_click",{edition:"en_paperback"})} target="_blank" rel="noopener noreferrer">Buy paperback <ArrowUpRight size={18}/></a></article>
      <article className="edition-card"><span className="edition-code">US // KINDLE</span><h3>CIPHER</h3><p className="edition-subtitle">The Orpheus Protocol</p><div className="edition-meta"><span>ENGLISH</span><span>KINDLE</span></div><a className="edition-buy" href="https://www.amazon.com/dp/B0HKW555L9" onClick={()=>track("cipher_amazon_click",{edition:"en_kindle"})} target="_blank" rel="noopener noreferrer">Buy Kindle <ArrowUpRight size={18}/></a></article>
    </div></div><p className="buy-footnote">AMAZON // 4 OFFICIAL EDITIONS // ROBERTO JUSTINO</p></div></section>
    <div id="dossies">{people.map((person, index) => <section className={`person-section section ${index % 2 ? "reverse" : ""}`} id={person.id} key={person.id}><div className="shell person-grid"><div className="person-art"><img src={person.image} alt={`${t.subject}: ${person.name}`} loading="lazy" /></div><div className="person-copy"><p className="section-index">{person.number} / {t.subject}</p><h2>{person.name}</h2><p>{t[person.id]}</p><span className="file-rule">{t.status} <span>━━━━━━━━━━</span> {person.number}</span></div></div></section>)}</div>
    <section className="protocol-section section" id="protocolo"><div className="shell person-grid"><div className="person-art"><img src="/orpheus/assets/protocol.webp" alt={t.protocolTitle} loading="lazy" /></div><div className="person-copy"><p className="section-index">{t.protocolKicker}</p><h2>{t.protocolTitle}</h2><p>{t.protocolText}</p><span className="red-stamp"><LockKeyhole size={16} /> {t.classified}</span></div></div></section>
    <section className="bridge-section"><div className="shell bridge-copy"><p className="section-index">CIPHER // ORPHEUS</p><h2>{language === "pt" ? "O livro é apenas a primeira camada." : "The book is only the first layer."}</h2><p>{language === "pt" ? "Algumas pistas não terminam na última página. ORPHEUS expande a história com terminal, dossiês e enigmas ligados ao universo CIPHER." : "Some clues do not end on the final page. ORPHEUS expands the story with a terminal, dossiers and puzzles connected to the CIPHER universe."}</p><a className="button-quiet" href="#orpheus" onClick={()=>track("cipher_orpheus_interest")}>{language === "pt" ? "DESCOBRIR ORPHEUS" : "DISCOVER ORPHEUS"} <ArrowDown size={16}/></a></div></section>
    <section className="orpheus-section section" id="orpheus"><div className="shell orpheus-grid"><div className="terminal-window" aria-hidden="true"><div className="terminal-bar"><span /><span /><span /><b>ORPHEUS://TERMINAL</b></div><div className="terminal-body"><p><span>›</span> whoami</p><p className="terminal-response">USER DETECTED</p><p><span>›</span> mission --status</p><p className="terminal-response">FILE 01 // AWAITING READER</p><p><span>›</span> open dossier/blake</p><p className="cursor-line">_</p></div></div><div className="orpheus-copy"><p className="section-index">{t.appKicker}</p><h2>{t.appTitle}</h2><p>{t.appText}</p><div className="app-feature"><Terminal size={18} /> {t.appFeature}</div><div className="orpheus-offer"><span className="offer-label">{language === "pt" ? "PREÇO DE LANÇAMENTO" : "LAUNCH PRICE"}</span><div className="offer-price"><strong>{language === "pt" ? "R$ 14,90" : "R$ 14.90"}</strong><span>{language === "pt" ? "de R$ 19,90" : "regular R$ 19.90"}</span></div><p>{language === "pt" ? "Licença digital · Windows · experiência ORPHEUS" : "Digital license · Windows · ORPHEUS experience"}</p></div><a className="button-primary" href="https://wa.me/5521998835257?text=Quero%20adquirir%20o%20Game%20ORPHEUS%20pelo%20pre%C3%A7o%20de%20lan%C3%A7amento%20de%20R%24%2014%2C90." target="_blank" rel="noreferrer" onClick={()=>track("cipher_orpheus_purchase_click",{price:14.90,currency:"BRL"})}>{language === "pt" ? "ADQUIRIR ORPHEUS" : "GET ORPHEUS"} <ArrowDown size={16} /></a><p className="purchase-note">{language === "pt" ? "Compra assistida pela ROVIX. Você receberá as instruções de pagamento e entrega." : "Assisted purchase by ROVIX. You will receive payment and delivery instructions."}</p></div></div></section>
    <section className="waitlist section" id="lista"><div className="shell waitlist-grid"><div><p className="section-index">ORPHEUS // AUTHORIZATION</p><h2>{language === "pt" ? "Receba o próximo arquivo." : "Receive the next file."}</h2><p className="waitlist-copy">{language === "pt" ? "Entre na lista confidencial de CIPHER para receber novidades, sinais do universo ORPHEUS e informações sobre os próximos arquivos." : "Join the CIPHER confidential list for updates, ORPHEUS signals and information about upcoming files."}</p></div><WaitlistForm language={language} /></div></section>
    <footer><div className="shell footer-grid"><a className="wordmark" href="#inicio">CI<span>PH</span>ER</a><p>© 2026 Roberto Justino da Silva Junior</p><p>PROTOCOLO ORPHEUS</p></div></footer>
  </div>;
}
