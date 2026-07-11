import "server-only";

export function adminConfigurationStatus() {
  return {
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    password: (process.env.ADMIN_PASSWORD?.length ?? 0) >= 16,
    sessionSecret: (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  };
}
