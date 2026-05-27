import { z } from 'zod';

export const ApiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TZ: z.string().default('Asia/Baku'),

  API_PORT: z.coerce.number().int().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_TTL: z.string().default('30d'),

  DATABASE_URL: z.string().min(10),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('washer-uploads'),
  S3_PUBLIC_URL: z.string().url().default('http://localhost:9000'),

  EVOLUTION_API_URL: z.string().url().default('http://localhost:8080'),
  EVOLUTION_API_KEY: z.string().default(''),
  EVOLUTION_INSTANCE_NAME: z.string().default('washer'),

  AZERICARD_MERCHANT_ID: z.string().default(''),
  AZERICARD_TERMINAL_ID: z.string().default(''),
  AZERICARD_SECRET_KEY: z.string().default(''),
  AZERICARD_GATEWAY_URL: z.string().default('https://testmpi.3dsecure.az/cgi-bin/cgi_link'),
  AZERICARD_MODE: z.enum(['mock', 'sandbox', 'production']).default('mock'),

  LLM_PROVIDER: z.enum(['ollama', 'openai', 'anthropic']).default('ollama'),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.1:8b'),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SENTRY_DSN: z.string().optional().default(''),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export const loadApiEnv = (raw: NodeJS.ProcessEnv = process.env): ApiEnv => {
  const parsed = ApiEnvSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return parsed.data;
};
