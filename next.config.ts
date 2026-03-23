import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Subidas multipart (vídeo → contenido); Route Handlers en Node suelen respetar el límite del host */
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
