import Link from "next/link";
import { ArrowRight, CheckCircle2, Cpu, Gauge, Layers3, Network, ShieldCheck, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/catalog";
import { productRepository } from "@/repositories/products";
import styles from "./v2-test.module.css";

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
          <div className={styles.glow}/>
          <img src="/logo.png" alt="ROVIX Automation"/>
          <small>Tecnologia · Automação · Inovação</small>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.kicker}>ROVIX V2 · TESTE</span>
            <h2>O visual original, agora com mais profundidade.</h2>
          </div>
          <p>Estamos mantendo a identidade atual e incorporando apenas estruturas que realmente melhoram apresentação, confiança e navegação.</p>
        </div>
        <div className={styles.featureGrid}>
          <article><div className={styles.icon}><Layers3/></div><h3>Produtos mais claros</h3><p>Cards, hierarquia e chamadas melhor organizadas, sem perder o visual escuro e premium.</p></article>
          <article><div className={styles.icon}><Gauge/></div><h3>Serviços mais objetivos</h3><p>Blocos de processo, benefícios e escopo com leitura rápida para clientes técnicos e empresariais.</p></article>
          <article><div className={styles.icon}><Sparkles/></div><h3>Visual ROVIX preservado</h3><p>Azul escuro, vermelho, grafite, branco e detalhes metálicos continuam sendo a base da marca.</p></article>
        </div>
      </section>

      <section className={styles.band}>
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.kicker}>Ecossistema</span>
            <h2>Produtos ROVIX em destaque</h2>
          </div>
          <p>Os links continuam usando as rotas oficiais do projeto atual.</p>
        </div>
        <div className={styles.productGrid}>{products.map(p => <ProductCard key={p.id} product={p}/>)}</div>
        <div className={styles.center}><Link className={styles.secondary} href="/apps">Ver catálogo completo <ArrowRight size={17}/></Link></div>
      </section>

      <section className={styles.section}>
        <div className={styles.processWrap}>
          <div>
            <span className={styles.kicker}>Como trabalhamos</span>
            <h2>Da necessidade à solução.</h2>
            <p>Um bloco de processo inspirado nos melhores templates da curadoria, mas redesenhado para a identidade da ROVIX.</p>
          </div>
          <div className={styles.steps}>
            {[
              ["01","Entender","Mapeamos o problema real, o fluxo e as restrições da operação."],
              ["02","Projetar","Definimos arquitetura, interface, integrações e critérios técnicos."],
              ["03","Construir","Desenvolvemos e validamos em etapas, priorizando confiabilidade."],
              ["04","Evoluir","A solução entra em uso e segue preparada para novas funções e integrações."]
            ].map(([n,t,d]) => <article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div>
          <span className={styles.kicker}>Tecnologia aplicada</span>
          <h2>Uma ROVIX mais completa, sem perder a identidade que já funciona.</h2>
        </div>
        <div className={styles.ctaList}>
          <span><CheckCircle2/> Visual atual preservado</span>
          <span><CheckCircle2/> Links oficiais mantidos</span>
          <span><CheckCircle2/> Novos blocos incorporados com critério</span>
        </div>
        <Link className={styles.primary} href="/contato">Falar com a ROVIX <ArrowRight size={18}/></Link>
      </section>
    </main>
  );
}
