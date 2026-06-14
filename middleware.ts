import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/privacy"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッション更新（JWT リフレッシュ）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // /mypage → /apply にリダイレクト（ページ統合）
  if (pathname === "/mypage") {
    return NextResponse.redirect(new URL("/apply", request.url));
  }

  // 未ログイン → /login へリダイレクト
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログイン済みで /login・/register → ロールに応じてリダイレクト
  if (user && isPublic) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const dest =
      profile?.role === "applicant" ? "/apply" : "/admin";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ログイン済みで /admin → applicant はアクセス不可
  if (user && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "applicant") {
      return NextResponse.redirect(new URL("/apply", request.url));
    }
  }

  return response;
}

export const config = {
  // API Routes・静的ファイルは除外
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
