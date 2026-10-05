import type {Metadata} from "next";
import DemoClient from "./DemoClient";

export const metadata:Metadata={
  title:"Demonstração TAGCheck",
  description:"Visualização pública e segura da interface do TAGCheck.",
  robots:{index:false,follow:true},
  alternates:{canonical:"/apps/tagcheck/demo"}
};

export default function TagCheckDemo(){
  return <DemoClient/>;
}
