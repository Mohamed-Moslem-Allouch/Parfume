const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' ${isDev ? "'unsafe-eval'" : ""} 'unsafe-inline' https://translate.google.com https://*.google.com https://translate.googleapis.com https://*.googleapis.com https://www.gstatic.com https://*.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://translate.google.com https://*.google.com https://translate.googleapis.com https://*.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https: http:",
  `connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://translate.google.com https://*.google.com https://translate.googleapis.com https://*.googleapis.com ${isDev ? "ws://192.168.1.11:* http://192.168.1.11:*" : ""}`,
  "frame-src 'self' https://translate.google.com https://*.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
]
  .filter(Boolean)
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  allowedDevOrigins: ["192.168.1.11", "localhost:3000"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
