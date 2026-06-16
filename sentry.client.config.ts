import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Porcentaje de transacciones enviadas a Sentry (performance tracing)
  tracesSampleRate: 0.1,

  // Porcentaje de sesiones capturadas para Session Replay
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay un error

  integrations: [
    Sentry.replayIntegration({
      // Enmascarar inputs y texto sensible por defecto
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // No enviar en desarrollo local
  enabled: process.env.NODE_ENV === 'production',
});
