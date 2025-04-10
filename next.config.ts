import type { NextConfig } from "next";
import withRspack from 'next-rspack';

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
};

export default withRspack(nextConfig);
