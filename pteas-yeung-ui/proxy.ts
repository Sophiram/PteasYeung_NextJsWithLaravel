import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  // ចាប់យក Token និង Role ពី Cookies របស់ Browser
  const token = request.cookies.get("access_token")?.value;

  // ចំណាំ៖ ដើម្បីឱ្យ Middleware ស្គាល់ Role បងត្រូវប្រាកដថាពេល Login បានរក្សាទុក user_role ក្នុង Cookie ដែរ (មិនមែនក្នុង localStorage ទេ ព្រោះ Middleware រត់លើ Server មិនស្គាល់ localStorage ឡើយ)
  const userRole = request.cookies.get("user_role")?.value?.toLowerCase();
  const { pathname } = request.nextUrl;

  // ១. បើគ្មាន Token ទេ ហើយព្យាយាមចូលទៅកាន់ផ្លូវ /dashboard
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ២. បើមាន Token រួចរាល់ហើយ តែអ្នកប្រើប្រាស់ព្យាយាមចូលទំព័រ /login ឬ /register
  if (token && (pathname === "/login" || pathname === "/register")) {
    if (userRole === "super_admin" || userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    } else if (userRole === "staff") {
      return NextResponse.redirect(new URL("/dashboard/staff", request.url));
    } else if (userRole === "owner") {
      return NextResponse.redirect(new URL("/dashboard/owner", request.url));
    } else if (userRole === "tenant") {
      return NextResponse.redirect(new URL("/dashboard/tenant", request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  // ៣. ការពារការឆ្លង Role ក្នុង Dashboard (Sub-route Role Guard)
  if (token && userRole) {
    if (pathname.startsWith("/dashboard/admin") && userRole !== "super_admin" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (pathname.startsWith("/dashboard/owner") && userRole !== "owner") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (pathname.startsWith("/dashboard/staff") && userRole !== "staff") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
