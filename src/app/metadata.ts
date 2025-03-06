import { Metadata } from 'next';

type MetadataParams = {
	title?: string;
	description?: string;
	image?: string;
	path?: string;
	noIndex?: boolean;
};

/**
 * ページごとのメタデータを生成する関数なのです
 * @param params メタデータのパラメータ
 * @returns Next.jsのMetadataオブジェクト
 */
export function generateMetadata({
	title,
	description = 'アプリ版けものフレンズ３wikiなのだ！の補助ページ',
	image = '/wiki-nanodesu/no_blue.png',
	path = '',
	noIndex = false,
}: MetadataParams): Metadata {
	// サイト名
	const siteName = 'アプリ版けものフレンズ３wikiなのです🦉';

	// タイトルの設定（指定があればそのまま使用、なければサイト名を使用）
	const metaTitle = title && title + ' - ' + siteName || siteName;

	// ベースURL
	const baseUrl = 'https://reamkf.github.io/wiki-nanodesu';

	// 完全なURL
	const url = path ? `${baseUrl}/${path.replace(/^\//, '')}` : baseUrl;

	// 画像の完全なURL
	const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

	return {
		title: metaTitle,
		description,
		icons: {
			icon: '/wiki-nanodesu/no_blue.png',
		},
		openGraph: {
			title: metaTitle,
			description,
			url,
			siteName,
			images: [
				{
					url: imageUrl,
					width: 256,
					height: 256,
					alt: metaTitle,
				},
			],
			locale: 'ja_JP',
			type: 'website',
		},
		twitter: {
			card: 'summary',
			title: metaTitle,
			description,
			images: {
				url: imageUrl,
				alt: metaTitle,
			},
		},
		...(noIndex && { robots: 'noindex, nofollow' }),
	};
}
