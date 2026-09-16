import type { NextConfig } from "next";
const config: NextConfig={
  reactStrictMode:true,
  poweredByHeader:false,
  output:"export",
  trailingSlash:true,
  images:{unoptimized:true,formats:["image/avif","image/webp"]},
  async rewrites(){
    return process.env.NODE_ENV === "development"
      ? [{source:"/intranet/",destination:"/intranet/index.html"}]
      : [];
  }
};
export default config;
