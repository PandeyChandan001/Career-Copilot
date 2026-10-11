import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdf2json", "@react-pdf/renderer"],
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "",
  },
};

export default nextConfig;
