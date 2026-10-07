import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdf2json", "@react-pdf/renderer"],
};

export default nextConfig;
