import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoutes = createRouteMatcher(["/", "/api/(.*)"]);
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default clerkMiddleware(async (auth, req) => {
  const userId = !!auth()?.userId;
  const stripePayment = auth()?.sessionClaims?.publicMetadata.stripe?.payment;

  if (!userId && !isPublicRoutes(req)) {
    return auth().redirectToSignIn();
  }

  if (
    auth()?.userId &&
    req.nextUrl.pathname === "/members" &&
    stripePayment !== "paid"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    userId &&
    req.nextUrl.pathname === "/members" &&
    stripePayment === "paid"
  ) {
    return;
  }

  if (userId && req.nextUrl.pathname !== "/members") {
    return;
  }

  if (isPublicRoutes(req)) {
    return;
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api)(.*)"],
};
