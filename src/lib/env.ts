import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

export const env = _env.success ? _env.data : ({} as z.infer<typeof envSchema>);
