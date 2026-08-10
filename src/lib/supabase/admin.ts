import { createClient } from "@supabase/supabase-js";

/** service_role JWT legado ou sb_secret_... — só em server-side. */
export function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    null
  );
}

/** Cliente com privilégios elevados — somente em rotas server-side. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServiceRoleKey();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
