import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
	?.split(",")
	.map((origin) => origin.trim())
	.filter((origin) => origin.length > 0);

const nextConfig: NextConfig = {
	output: "export",
	basePath: "/wiki-nanodesu",
	assetPrefix: "/wiki-nanodesu",
	images: {
		unoptimized: true,
		path: "https://reamkf.github.io/wiki-nanodesu/",
		remotePatterns: [
			{
				hostname: "image01.seesaawiki.jp",
			},
			{
				hostname: "image02.seesaawiki.jp",
			},
		],
	},
	allowedDevOrigins,
};

export default nextConfig;
