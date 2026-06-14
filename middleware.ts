import { NextResponse, type NextRequest } from 'next/server';
import { environmentFromHost } from './app/_lib/environmentCore';

function unauthorized(message = 'Authentication required') {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Ritim Console"',
    },
  });
}

function isProtectedConsolePath(pathname: string) {
  return pathname === '/console'
    || pathname.startsWith('/console/')
    || pathname === '/sports-center-console'
    || pathname.startsWith('/sports-center-console/');
}

export function middleware(request: NextRequest) {
  const environment = environmentFromHost(request.headers.get('host'));
  const { pathname } = request.nextUrl;

  if (environment !== 'production' || !isProtectedConsolePath(pathname)) {
    return NextResponse.next();
  }

  const expectedUser = process.env.CONSOLE_BASIC_AUTH_USER;
  const expectedPassword = process.env.CONSOLE_BASIC_AUTH_PASSWORD;
  if (!expectedUser || !expectedPassword) {
    return unauthorized('Production console is locked. Configure CONSOLE_BASIC_AUTH_USER and CONSOLE_BASIC_AUTH_PASSWORD.');
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) return unauthorized();

  const decoded = atob(authorization.slice('Basic '.length));
  const [user, ...passwordParts] = decoded.split(':');
  const password = passwordParts.join(':');

  if (user !== expectedUser || password !== expectedPassword) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/console/:path*', '/sports-center-console/:path*'],
};
