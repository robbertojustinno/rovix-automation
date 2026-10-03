import Link from "next/link";
import { ArrowRight, Boxes, BrainCircuit, Cable, CheckCircle2, CloudCog, Cpu, Gauge, HardDrive, Layers3, LockKeyhole, Network, Orbit, ScanLine, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { ProductCard } from "@/components/catalog";
import { productRepository } from "@/repositories/products";
import styles from "./v2-test.module.css";

const pillars = [
  {icon:<Cpu/>, title:"Automação industrial", text:"Soluções para chão de fábrica, instrumentação, integração e controle de processos."},
  {icon:<CloudCog/>, title:"Software e SaaS", text:"Aplicações web e plataformas próprias que organizam ativos, dados e operações."},
  {icon:<LockKeyhole/>, title:"Cibersegurança", text:"Ferramentas de diagnóstico, rastreabilidade e proteção para ambientes técnicos."},
  {icon:<Workflow/>, title:"Integrações", text:"Sistemas, APIs, dispositivos e dados conectados em um único ecossistema."}
];

const ecosystem = [
  ["TagCheck","Gestão metrológica e rastreabilidade de instrumentos.","/apps/tagcheck","METROLOGIA"],
  ["ROVIX Drive","Arquivos, distribuição digital e acesso a produtos ROVIX.","/apps","CLOUD"],
  ["UAP Studio","Conectividade industrial e comunicação entre dispositivos.","/apps","INDÚSTRIA"],
  ["Machine Watch","Monitoramento técnico de processos, USB e eventos do sistema.","/apps","DIAGNÓSTICO"],
  ["O67","Opportunity OS para organizar oportunidades e ações comerciais.","/067","OPERAÇÃO"],
  ["CIPHER","Universo editorial e produtos digitais ligados ao projeto CIPHER.","/cipher","CONTEÚDO"]
];

const process = [
  ["01","Diagnóstico","Entender o problema real e eliminar complexidade desnecessária."],
  ["02","Arquitetura","Definir tecnologia, integrações, dados e experiência de uso."],
  ["03","Implementação","Construir de forma incremental, testável e rastreável."],
  ["04","Evolução","Medir o uso, consolidar o que funciona e ampliar capacidades."]
];

export default async function RovixV2Test() {
  const products = (await productRepository.findCatalog()).slice(0, 6);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>Software · Rastreamento · Aplicativos · Automação</span>
          <h1>Soluções inteligentes para um <span>mundo conectado.</span></h1>
          <p>A ROVIX Automation desenvolve sistemas modernos para transformar ideias em plataformas digitais, automação, controle de ativos e aplicações sob medida.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/apps">Conhecer os aplicativos <ArrowRight size={18}/></Link>
            <Link className={styles.secondary} href="/contato">Falar com a ROVIX</Link>
          </div>
          <div className={styles.trust}>
            <span><ShieldCheck size={17}/> Tecnologia própria</span>
            <span><Cpu size={17}/> Arquitetura moderna</span>
            <span><Network size={17}/> Ecossistema integrado</span>
          </div>
        </div>
        <div className={styles.brandStage}>
          <div className={styles.orbitA}/>
          <div className={styles.orbitB}/>
          <div className={styles.glow}/>
          <img src="/logo.png" alt="ROVIX Automation"/>
          <small>Tecnologia · Automação · Inovação</small>
        </div>
      </section>

      <section className={styles.signatureStrip}>
        <div><span>01</span><strong>Industrial</strong><small>Automação & Instrumentação</small></div>
        <div><span>02</span><strong>Digital</strong><small>Software & Produtos</small></div>
        <div><span>03</span><strong>Secure</strong><small>Cibersegurança & Diagnóstico</small></div>
        <div><span>04</span><strong>Connected</strong><small>Integrações & Dados</small></div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div><span className={styles.kicker}>ROVIX V2 · TESTE</span><h2>Quatro frentes. Um único ecossistema.</h2></div>
          <p>Agora a identidade original continua intacta, mas o restante da página passa a comunicar melhor o que a ROVIX realmente entrega.</p>
        </div>
        <div className={styles.pillars}>
          {pillars.map((p,i)=><article key={p.title} className={styles.pillarCard}><div className={styles.pillarTop}><span>0{i+1}</span><div className={styles.icon}>{p.icon}</div></div><h3>{p.title}</h3><p>{p.text}</p><div className={styles.cardLine}/></article>)}
        </div>
      </section>

      <section className={styles.ecosystemSection}>
        <div className={styles.ecosystemIntro}>
          <span className={styles.kicker}>Ecossistema ROVIX</span>
          <h2>Produtos que já existem.<br/>Agora organizados como plataforma.</h2>
          <p>A V2 deixa de parecer apenas um site institucional e passa a mostrar claramente a rede de produtos, serviços e soluções da marca.</p>
          <Link className={styles.textLink} href="/apps">Explorar o catálogo <ArrowRight size={17}/></Link>
        </div>
        <div className={styles.ecosystemGrid}>
          {ecosystem.map(([name,desc,href,tag],idx)=><Link href={href} className={styles.ecoCard} key={name}>
            <div className={styles.ecoMeta}><span>{tag}</span><b>0{idx+1}</b></div>
            <h3>{name}</h3><p>{desc}</p><div className={styles.ecoArrow}><ArrowRight/></div>
          </Link>)}
        </div>
      </section>

      <section className={styles.metricBand}>
        <div><strong>01</strong><span>Marca central</span><small>ROVIX Automation</small></div>
        <div><strong>06+</strong><span>Produtos principais</span><small>em expansão</small></div>
        <div><strong>24/7</strong><span>Presença digital</span><small>site, hub e apps</small></div>
        <div><strong>360°</strong><span>Visão de solução</span><small>indústria + software</small></div>
      </section>

      <section className={styles.band}>
        <div className={styles.sectionHead}>
          <div><span className={styles.kicker}>Aplicativos ROVIX</span><h2>Produtos em destaque</h2></div>
          <p>O catálogo oficial continua sendo a fonte dos cards e das rotas já existentes.</p>
        </div>
        <div className={styles.productShell}><div className={styles.productGrid}>{products.map(p => <ProductCard key={p.id} product={p}/>)}</div></div>
        <div className={styles.center}><Link className={styles.secondary} href="/apps">Ver todos os aplicativos <ArrowRight size={17}/></Link></div>
      </section>

      <section className={styles.section}>
        <div className={styles.splitShowcase}>
          <div className={styles.visualPanel}>
            <div className={styles.screenTop}><span/><span/><span/></div>
            <div className={styles.diagram}>
              <div className={styles.core}><Orbit size={34}/><b>ROVIX CORE</b></div>
              <div className={styles.nodeA}><ScanLine/><span>Dados</span></div>
              <div className={styles.nodeB}><HardDrive/><span>Ativos</span></div>
              <div className={styles.nodeC}><Cable/><span>Integrações</span></div>
              <div className={styles.nodeD}><BrainCircuit/><span>Automação</span></div>
            </div>
          </div>
          <div className={styles.showcaseText}>
            <span className={styles.kicker}>Mais do que páginas bonitas</span>
            <h2>Uma arquitetura que ajuda o visitante a entender a ROVIX.</h2>
            <p>Os melhores blocos da biblioteca de templates estão sendo convertidos para a linguagem visual da marca, sem copiar a aparência genérica dos modelos.</p>
            <ul>
              <li><CheckCircle2/> produtos e serviços com hierarquia clara</li>
              <li><CheckCircle2/> blocos de processo e benefícios mais fortes</li>
              <li><CheckCircle2/> melhor leitura em desktop e mobile</li>
              <li><CheckCircle2/> links e rotas históricas preservados</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.processSection}>
        <div className={styles.processTitle}><span className={styles.kicker}>Método ROVIX</span><h2>Da necessidade à operação.</h2></div>
        <div className={styles.steps}>{process.map(([n,t,d])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div>
      </section>

      <section className={styles.supportSection}>
        <div><span className={styles.kicker}>Suporte & continuidade</span><h2>Produtos não terminam no deploy.</h2><p>A nova estrutura também reserva espaço para suporte, documentação, downloads, atualizações e acesso ao ecossistema ROVIX.</p></div>
        <div className={styles.supportCards}>
          <Link href="/intranet/"><Boxes/><strong>ROVIX Hub</strong><span>Central de acesso</span></Link>
          <Link href="/contato"><Network/><strong>Suporte</strong><span>Contato técnico e comercial</span></Link>
          <Link href="/apps"><Layers3/><strong>Produtos</strong><span>Catálogo oficial</span></Link>
        </div>
      </section>

      <section className={styles.cta}>
        <div><span className={styles.kicker}>ROVIX V2</span><h2>Agora a diferença precisa aparecer.</h2><p>O topo continua sendo ROVIX. O restante passa a mostrar melhor a dimensão do ecossistema.</p></div>
        <Link className={styles.primary} href="/contato">Falar com a ROVIX <ArrowRight size={18}/></Link>
      </section>
    </main>
  );
}