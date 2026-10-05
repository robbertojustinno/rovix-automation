import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,FileText,LockKeyhole,QrCode,Search,ShieldCheck} from "lucide-react";

export const metadata:Metadata={
  title:"Demonstração TAGCheck",
  description:"Visualização pública e segura da interface do TAGCheck.",
  robots:{index:false,follow:true},
  alternates:{canonical:"/apps/tagcheck/demo"}
};

const fields=[
  "TAG *","Nome *","Tipo de equipamento","Setor","Localização","Fabricante","Modelo","Nº de série",
  "Data de calibração","Próxima calibração","Status","Categoria"
];

const metrology=[
  "Grandeza","Unidade de medição","Faixa mínima","Faixa máxima","Classe","Resolução","EMA","Contribuição estimada da leitura"
];

export default function TagCheckDemo(){
  return <main className="tagDemoPage">
    <section className="tagDemoNotice">
      <div><ShieldCheck size={18}/><strong>DEMONSTRAÇÃO — MODO SOMENTE VISUALIZAÇÃO</strong></div>
      <span>Nenhum dado real, login ou banco de produção é utilizado nesta página.</span>
    </section>

    <section className="tagDemoShell">
      <div className="tagDemoTopbar">
        <div>
          <Link href="/" className="tagDemoBack"><ArrowLeft size={16}/> ROVIX</Link>
          <span className="tagDemoBrand">TAGCHECK <small>ADMIN</small></span>
        </div>
        <div className="tagDemoCompany"><b>Empresa Demonstração</b><small>Ambiente público de apresentação</small></div>
      </div>

      <div className="tagDemoHero">
        <div>
          <span className="tagDemoKicker">Gerenciamento de ativos</span>
          <h1>TagAdmin</h1>
          <p>Veja como sua empresa cadastra, organiza e consulta ativos no TAGCheck. Esta tela é apenas uma demonstração visual.</p>
        </div>
        <div className="tagDemoHeroActions">
          <button disabled><QrCode size={17}/> Viewer</button>
          <button disabled><FileText size={17}/> Gerar PDF</button>
        </div>
      </div>

      <div className="tagDemoGrid">
        <section className="tagDemoCard tagDemoFormCard">
          <div className="tagDemoCardHead"><div><span>Cadastro</span><h2>Novo ativo</h2></div><LockKeyhole size={20}/></div>
          <div className="tagDemoFormGrid">
            {fields.map(field=><label key={field}><span>{field}</span>{field==="Status"||field==="Categoria"?<select disabled defaultValue=""><option value="">Selecione...</option></select>:<input disabled placeholder={field.includes("*")?"Preenchimento obrigatório":""}/>}</label>)}
          </div>
          <div className="tagDemoMetrology">
            <div className="tagDemoSectionTitle"><span>Dados Metrológicos</span><small>Campos opcionais</small></div>
            <div className="tagDemoFormGrid">
              {metrology.map(field=><label key={field}><span>{field}</span><input disabled/></label>)}
            </div>
          </div>
          <div className="tagDemoActions">
            <button disabled>Salvar ativo</button>
            <span>Recurso disponível na versão completa do TAGCheck.</span>
          </div>
        </section>

        <aside className="tagDemoCard tagDemoSide">
          <div className="tagDemoCardHead"><div><span>Organização</span><h2>Categorias</h2></div></div>
          <div className="tagDemoEmptySmall">Nenhuma categoria criada.</div>
          <button disabled className="tagDemoGhost">+ Nova categoria</button>

          <div className="tagDemoSideDivider"/>
          <div className="tagDemoCardHead"><div><span>Acesso</span><h2>Administração</h2></div></div>
          <div className="tagDemoMiniRows">
            <span>Usuários e permissões</span>
            <span>Unidades</span>
            <span>Logo da empresa</span>
          </div>
        </aside>
      </div>

      <section className="tagDemoCard tagDemoAssets">
        <div className="tagDemoCardHead tagDemoAssetsHead">
          <div><span>Ativos cadastrados</span><h2>Gerenciador de ativos</h2></div>
          <div className="tagDemoSearch"><Search size={17}/><input disabled placeholder="Buscar TAG ou nome"/></div>
        </div>
        <div className="tagDemoFilters">
          <button disabled>Todos os ativos</button><button disabled>Unidade</button><button disabled>Status</button>
        </div>
        <div className="tagDemoTable">
          <div className="tagDemoTableHead"><span>TAG</span><span>Nome</span><span>Categoria</span><span>Unidade</span><span>Status</span><span>Ações</span></div>
          <div className="tagDemoEmpty">
            <QrCode size={34}/>
            <h3>Nenhum ativo cadastrado</h3>
            <p>A versão completa exibirá aqui os equipamentos da empresa.</p>
          </div>
        </div>
      </section>

      <section className="tagDemoCta">
        <div><span>Quer usar o TAGCheck na sua empresa?</span><h2>Transforme esta demonstração em sua operação real.</h2></div>
        <Link className="button" href="/contato">Falar com a ROVIX</Link>
      </section>
    </section>
  </main>
}
