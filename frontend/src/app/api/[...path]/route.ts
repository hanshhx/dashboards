import { NextRequest } from 'next/server';

// 백엔드로 프록시 (서버 사이드). 브라우저는 같은 출처 /api 만 호출.
// API_KEY 는 서버 환경변수라 브라우저에 노출되지 않음.
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080';
const API_KEY = process.env.API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${BACKEND}/api/${path}${req.nextUrl.search}`;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  try {
    const res = await fetch(url, { headers, cache: 'no-store' });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'bad_gateway', message: '백엔드에 연결할 수 없습니다.' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }
}
