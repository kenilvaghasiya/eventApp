import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertSupabaseEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const env = assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl!, env.supabaseAnon!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      }
    }
  });
}
