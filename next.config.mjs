/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/Product/**",
      },
      {
        protocol: "https",
        hostname: "api.myapp.com", // replace with your real backend domain
        pathname: "/Product/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/AdminProfile/**", // <-- added for avatars
      },
      {
        protocol: "https",
        hostname: "api.myapp.com", // replace with your real backend domain
        pathname: "/Product/**",
      },
    ],
  },
};

export default nextConfig;
