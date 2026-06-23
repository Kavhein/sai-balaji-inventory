import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const session = request.cookies.get('auth_session');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // 1. If trying to access protected page without session, redirect to login
    if (!session && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Role-based access control
    if (session) {
        const role = session.value;
        const isRestrictedPage =
            request.nextUrl.pathname.startsWith('/reports') ||
            request.nextUrl.pathname.startsWith('/logs');

        if (role !== 'admin' && isRestrictedPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Redirect away from login if already logged in
        if (isLoginPage) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

// Ensure proxy runs on all routes except static files, PWA files, and icons
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon.png).*)'],
};
