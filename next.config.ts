import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "export",
	basePath: process.env.NODE_ENV === 'production'
		? '/wiki-nanodesu'
		: '',
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

console.log('NODE_ENV:', process.env.NODE_ENV)

export default nextConfig;
