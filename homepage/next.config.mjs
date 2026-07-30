const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  ...(isGithubPagesBuild && {
    output: "export",
    basePath: "/teumta-app/homepage-site",
    assetPrefix: "/teumta-app/homepage-site/",
  }),
};

export default nextConfig;
