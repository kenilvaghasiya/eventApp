import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const env = assertSupabaseEnv();
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnon!);
}
