import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { assertSupabaseEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const env = assertSupabaseEnv();
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnon!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return { response, user };
}
