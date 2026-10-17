import type { NextConfig } from "next";

// Base URL of the Gazellekey backend API project (no trailing slash)
const apiUrl = process.env.API_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  // The browser calls /api/... on this site and Next.js forwards it to the
  // backend. Browser and admin stay on one origin, so the backend's
  // httpOnly "login-token" cookie works without any CORS setup.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
