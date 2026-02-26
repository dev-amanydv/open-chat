import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isRouteProtected = createRouteMatcher(["/chats(.*)", "/agents(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (isRouteProtected(request)) {
    if (!userId) {
      await auth.protect();
    }
  }

  if (userId && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/chats", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
