import type { NextConfig } from "next";

const allowedDevOrigins = [
  "10.*.*.*",
  "172.*.*.*",
  "192.168.*.*",
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
