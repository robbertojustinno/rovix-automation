"use client";

import Link from "next/link";
import {useState} from "react";
import {ArrowLeft,FileText,LockKeyhole,QrCode,Search,ShieldCheck} from "lucide-react";

const assets=[
  {
    tag:"DEMO-PRESSAO-01",
    nome:"Manômetro de processo",
    tipo:"Manômetro",
    setor:"Área Demo",
    localizacao:"Linha de demonstração",
    fabricante:"Fabricante Exemplo",
    modelo:"MP-630-D",
    serie:"SN-DEMO-001",
    calibracao:"01/09/2026",
    proxima:"01/09/2027",
    status:"Calibrado",
    categoria:"Instrumentação",
    grandeza:"Pressão",
    unidade:"mmWS",
    faixaMin:"0",
    faixaMax:"630",
    classe:"2,0 %",
    resolucao:"10 mmWS",
    ema:"±12,6 mmWS",
    contribuicao:"±5 mmWS"
  },
  {
    tag:"DEMO-TEMP-01",
    nome:"Termômetro digital",
    tipo:"Termômetro",
    setor:"Laboratório Demo",
    localizacao:"Bancada de demonstração",
    fabricante:"Fabricante Exemplo",
    modelo:"TD-200-D",
    serie:"SN-DEMO-002",
    calibracao:"15/09/2026",
    proxima:"15/09/2027",
    status:"Calibrado",
    categoria:"Instrumentação",
    grandeza:"Temperatura",
    unidade:"°C",
    faixaMin:"0",
    faixaMax:"200",
    classe:"0,5 %",
    resolucao:"0,1 °C",
    ema:"±1,0 °C",
    contribuicao:"±0,05 °C"
  }
];

const fieldRows=[
  ["TAG *","tag"],["Nome *","nome"],["Tipo de equipamento","tipo"],["Setor","setor"],
  ["Localização","localizacao"],["Fabricante","fabricante"],["Modelo","modelo"],["Nº de série","serie"],
  ["Data de calibração","calibracao"],["Próxima calibração","proxima"],["Status","status"],["Categoria","categoria"]
] as const;

const metrologyRows=[
  ["Grandeza","grandeza"],["Unidade de medição","unidade"],["Faixa mínima","faixaMin"],["Faixa máxima","faixaMax"],
  ["Classe","classe"],["Resolução","resolucao"],["EMA","ema"],["Contribuição estimada da leitura","contribuicao"]
] as const;

export default function DemoClient(){
  const [selectedTag,setSelectedTag]=useState(assets[0].tag);
  const selected=assets.find(a=>a.tag===selectedTag) ?? assets[0];

  return <main className="tagDemoPage">
    <section className="tagDemoNotice">
      <div><ShieldCheck size={18}/><strong>DEMONSTRAÇÃO — MODO SOMENTE VISUALIZAÇÃO</strong></div>
      <span>Todos os dados exibidos abaixo são fictícios e não utilizam o banco de produção.</span>
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
          <p>Selecione um instrumento fictício para visualizar como o cadastro e os dados metrológicos aparecem no TAGCheck.</p>
        </div>
        <div className="tagDemoHeroActions">
          <button disabled><QrCode size={17}/> Viewer</button>
          <button disabled><FileText size={17}/> Gerar PDF</button>
        </div>
      </div>

      <div className="tagDemoSelector">
        <label>
          <span>Selecionar instrumento de demonstração</span>
          <select value={selectedTag} onChange={e=>setSelectedTag(e.target.value)}>
            {assets.map(a=><option value={a.tag} key={a.tag}>{a.tag} — {a.nome}</option>)}
          </select>
        </label>
        <small>Ao selecionar um instrumento, os campos abaixo são preenchidos automaticamente.</small>
      </div>

      <div className="tagDemoGrid">
        <section className="tagDemoCard tagDemoFormCard">
          <div className="tagDemoCardHead"><div><span>Cadastro do ativo</span><h2>{selected.tag}</h2></div><LockKeyhole size={20}/></div>
          <div className="tagDemoFormGrid">
            {fieldRows.map(([label,key])=><label key={key}><span>{label}</span><input readOnly value={selected[key]}/></label>)}
          </div>

          <div className="tagDemoMetrology">
            <div className="tagDemoSectionTitle"><span>Dados Metrológicos</span><small>Dados fictícios de demonstração</small></div>
            <div className="tagDemoFormGrid">
              {metrologyRows.map(([label,key])=><label key={key}><span>{label}</span><input readOnly value={selected[key]}/></label>)}
            </div>
          </div>

          <div className="tagDemoActions">
            <button disabled>Salvar ativo</button>
            <span>Recurso disponível na versão completa do TAGCheck.</span>
          </div>
        </section>

        <aside className="tagDemoCard tagDemoSide">
          <div className="tagDemoCardHead"><div><span>Organização</span><h2>Categorias</h2></div></div>
          <div className="tagDemoMiniRows"><span>Instrumentação</span><span>Pressão</span><span>Temperatura</span></div>
          <button disabled className="tagDemoGhost">+ Nova categoria</button>
          <div className="tagDemoSideDivider"/>
          <div className="tagDemoCardHead"><div><span>Acesso</span><h2>Administração</h2></div></div>
          <div className="tagDemoMiniRows"><span>Usuários e permissões</span><span>Unidades</span><span>Logo da empresa</span></div>
        </aside>
      </div>

      <section className="tagDemoCard tagDemoAssets">
        <div className="tagDemoCardHead tagDemoAssetsHead">
          <div><span>Ativos cadastrados</span><h2>Gerenciador de ativos</h2></div>
          <div className="tagDemoSearch"><Search size={17}/><input disabled placeholder="Buscar TAG ou nome"/></div>
        </div>
        <div className="tagDemoTable">
          <div className="tagDemoTableHead"><span>TAG</span><span>Nome</span><span>Categoria</span><span>Unidade</span><span>Status</span><span>Ações</span></div>
          <div className="tagDemoTableRows">
            {assets.map(asset=><div className={"tagDemoTableRow "+(asset.tag===selectedTag?"tagDemoTableRowActive":"")} key={asset.tag} onClick={()=>setSelectedTag(asset.tag)}>
              <div><b>{asset.tag}</b><small>{asset.grandeza} • {asset.faixaMin} a {asset.faixaMax} {asset.unidade}</small></div>
              <div><b>{asset.nome}</b><small>Classe {asset.classe} • Resolução {asset.resolucao} • EMA {asset.ema}</small></div>
              <span>{asset.categoria}</span><span>{asset.setor}</span><span><i className="tagDemoStatus">{asset.status}</i></span>
              <span className="tagDemoRowAction">Ver cadastro</span>
            </div>)}
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
