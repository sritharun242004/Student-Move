import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const pathname = req.nextUrl.pathname;
		const isMerchant = token?.role === "merchant";

		if (pathname.startsWith("/dashboard") && isMerchant) {
			return NextResponse.redirect(new URL("/merchant-dashboard", req.url));
		}

		if (pathname.startsWith("/merchant-dashboard") && !isMerchant) {
			return NextResponse.redirect(new URL("/dashboard", req.url));
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => Boolean(token),
		},
	}
);

export const config = {
	matcher: ["/dashboard/:path*", "/merchant-dashboard/:path*"],
};
