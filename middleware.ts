// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(req: Request) {
  const url = new URL(req.url);
  const host = url.host;
  const isStaging = host.startsWith('staging.') || process.env.NEXT_PUBLIC_IS_STAGING === 'true';

  if (!isStaging) return NextResponse.next();

  const auth = req.headers.get('authorization');
  const expected = 'Basic ' + Buffer.from(`${process.env.BASIC_AUTH_USER}:${process.env.BASIC_AUTH_PASS}`).toString('base64');

  if (auth !== expected) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="SonShine Staging"' }
    });
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };