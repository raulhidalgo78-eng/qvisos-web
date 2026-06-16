import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dafsjupnqeqrfjmgbrji.supabase.co',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Subir source maps a Sentry en cada build (necesita SENTRY_AUTH_TOKEN)
  org: "qvisos",
  project: "qvisos-cl",

  // Solo subir source maps en CI/Vercel, no localmente
  silent: !process.env.CI,

  // Source maps en producción para stack traces legibles
  widenClientFileUpload: true,

  // Eliminar source maps del bundle cliente después de subirlos
  hideSourceMaps: true,

  // Reducir el tamaño del bundle de Sentry
  disableLogger: true,

  // Tunnel para evitar ad-blockers
  tunnelRoute: "/monitoring",

  automaticVercelMonitors: true,
});
