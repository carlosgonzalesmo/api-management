// Archivo: src/config/configuration.ts
// Exporta una función (default) que devuelve el objeto de configuración.

const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiKey: process.env.API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  responseBodyMaxBytes: parseInt(process.env.RESPONSE_BODY_MAX_BYTES || '262144', 10),
  defaultTimeoutMs: parseInt(process.env.DEFAULT_TIMEOUT_MS || '10000', 10),
  schedulerCron: process.env.SCHEDULER_CRON || '*/1 * * * *',
  isScheduler: (process.env.IS_SCHEDULER || 'true').toLowerCase() === 'true',
});

export default configuration;