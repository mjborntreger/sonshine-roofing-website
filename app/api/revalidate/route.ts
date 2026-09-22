import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function deploymentRequired(req: Request) {
  const url = new URL(req.url);
  const incoming = req.headers.get('x-revalidate-secret')
    || req.headers.get('x-vercel-reval-key') || url.searchParams.get('secret') || '';
  const expected = process.env.REVALIDATE_SECRET || '';
  const authorized = expected.length > 0 && incoming === expected;
  return NextResponse.json(
    authorized
      ? { error: 'Content is deployment-only. Build and deploy the site to publish CMS changes.' }
      : { error: 'Unauthorized' },
    { status: authorized ? 410 : 401, headers: { 'Cache-Control': 'no-store' } },
  );
}

// Retired webhook contract: no route, tag, or layout can invalidate content.
export const POST = deploymentRequired;
export const GET = deploymentRequired;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-revalidate-secret',
    },
  });
}
