import type { Config } from "tailwindcss";

export default {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
			},
			// textColor: {
			// 	'funny': 'red',
			// 	'relax': '#0075c8',
			// 	'friendry': '#009e25',
			// 	'lovely': '#ffb3b3',
			// 	'mypace': '#88abda',
			// 	'active': '#a6cf00',
			// },
		},
	},
	plugins: [],
} satisfies Config;
