import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('error'),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(): Env {
  return EnvSchema.parse(process.env);
}
