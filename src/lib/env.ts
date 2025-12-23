const envVars = {
  SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? ''
}

type EnvVar = keyof typeof envVars

export function getEnv(name: EnvVar) {
  const value = envVars[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

