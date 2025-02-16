import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
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
};

export default nextConfig;
