/** @type {import("next").NextConfig} */
const nextConfig = {

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  async redirects() {
    return [
      /* Redirect removed */
    ];
  },
};

export default nextConfig;
