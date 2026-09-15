import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'Clerk publishable key required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key required'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
