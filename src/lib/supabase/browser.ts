import { createBrowserClient } from "@supabase/ssr";

import { type Database } from "@/db/types";
import { assertEnv, getEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  assertEnv();
  const env = getEnv();
  return createBrowserClient<Database>(env.supabaseUrl!, env.supabaseAnonKey!);
}
