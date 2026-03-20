// ============================================
// PadPal — Server-side Supabase Helpers
// Shared across all API routes
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Get the authenticated user from request cookies.
 * Use this in API routes to verify the caller's identity.
 */
export async function getAuthUser(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response = NextResponse.next({
              request: { headers: req.headers },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

/**
 * Get the Supabase admin client (bypasses RLS).
 * Uses SUPABASE_SERVICE_ROLE_KEY — never expose to browser.
 */
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );
  }
  return _supabaseAdmin;
}
