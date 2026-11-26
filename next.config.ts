import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  logging: {
    // Callback query parameters are short-lived credentials, not access logs.
    incomingRequests: { ignore: [/^\/auth\/confirm(?:[/?]|$)/] },
  },
};

export default nextConfig;
