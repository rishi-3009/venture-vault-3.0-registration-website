/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: lets the Cloudflare quick tunnel (or your LAN IP) load the JS
  // bundle. Without this, Next.js's dev server silently blocks cross-origin
  // requests for /_next/* resources — the page renders but no JS ever runs,
  // which looks exactly like "nothing is interactive on my phone".
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "192.168.29.169",
  ],
};

export default nextConfig;
