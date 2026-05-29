/** @type {import('next').NextConfig} */
const backend = process.env.BACKEND_URL || 'http://localhost:8080';

const nextConfig = {
  async rewrites() {
    // 브라우저는 같은 출처 /api 만 호출 → Next 서버가 백엔드로 프록시 (CORS 불필요)
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
