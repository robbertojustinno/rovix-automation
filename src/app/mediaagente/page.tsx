import type {Metadata} from "next";

export const metadata:Metadata={
  title:"ROVIX Social Agent",
  description:"Central automatizada de conteúdo da ROVIX Automation.",
  robots:{index:false,follow:false},
  alternates:{canonical:"/mediaagente/"}
};

export default function MediaAgentePage(){
  return (
    <section style={{width:"100%",minHeight:"calc(100vh - 120px)",background:"#070b12",padding:0}}>
      <iframe
        src="https://rovix-drive-api.onrender.com/social-agent/"
        title="ROVIX Social Agent"
        style={{display:"block",width:"100%",height:"calc(100vh - 90px)",minHeight:"760px",border:0,background:"#070b12"}}
        allow="clipboard-read; clipboard-write"
      />
    </section>
  );
}
