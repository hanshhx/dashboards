import { NextRequest } from 'next/server';

// 백엔드로 프록시 (서버 사이드). 브라우저는 같은 출처 /api 만 호출.
// - X-API-Key: 서버 환경변수(브라우저 비노출)로 주입 → 백엔드 ApiKeyFilter 통과.
// - Authorization: 브라우저가 보낸 Bearer 토큰(JWT)을 그대로 백엔드에 전달.
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080';
const API_KEY = process.env.API_KEY || '';

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, pathParts: string[]) {
  const url = `${BACKEND}/api/${pathParts.join('/')}${req.nextUrl.search}`;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  const ct = req.headers.get('content-type');
  if (ct) headers['content-type'] = ct;

  const method = req.method;
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
  const body = hasBody ? await req.text() : undefined;

  try {
    const res = await fetch(url, { method, headers, body, cache: 'no-store' });
    const text = await res.text();
    return new Response(text, {
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

type Ctx = { params: { path: string[] } };
export const GET = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const POST = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PATCH = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const PUT = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
export const DELETE = (req: NextRequest, { params }: Ctx) => proxy(req, params.path);
