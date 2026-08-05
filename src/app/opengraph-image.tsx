import {ImageResponse} from "next/og";
export const dynamic="force-static";
export const alt="ROVIX Automation — Tecnologia, automação e inovação";
export const size={width:1200,height:630};
export const contentType="image/png";
export default function Image(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:90,color:"white",background:"linear-gradient(125deg,#071022,#163c91 60%,#9e2536)",fontFamily:"sans-serif"}}><div style={{display:"flex",fontSize:28,letterSpacing:6}}>ROVIX <span style={{color:"#88aaff",marginLeft:14}}>AUTOMATION</span></div><div style={{display:"flex",flexDirection:"column",fontSize:78,fontWeight:800,lineHeight:1.05,marginTop:80}}><span>Soluções inteligentes.</span><span>Um mundo conectado.</span></div><div style={{fontSize:24,color:"#d4def4",marginTop:35}}>Tecnologia, automação, aplicativos e sistemas.</div></div>,size)}
