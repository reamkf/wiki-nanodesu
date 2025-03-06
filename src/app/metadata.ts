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
 * @param params.title ページのタイトル
 * @param params.description ページの説明
 * @param params.image ページの画像のパス(https://reamkf.github.io/wiki-nanodesu/に対する相対パス、またはhttpから始まるURLでも可)
 * @param params.path ページのパス(https://reamkf.github.io/wiki-nanodesu/に対する相対パス)
 * @param params.noIndex インデックスを禁止するかどうか
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

	// タイトルの設定（空文字でなければ" - サイト名"を付与。空文字の場合はサイト名のみ）
	const metaTitle = title && title + ' - ' + siteName || siteName;

	// ベースURL
	const baseUrl = 'https://reamkf.github.io/wiki-nanodesu';

	function removeLeadingSlash(str: string): string {
		if (str.startsWith('/')) {
			return str.slice(1);
		}
		return str;
	}

	// 完全なURL
	const url = path ? `${baseUrl}/${removeLeadingSlash(path)}` : baseUrl;

	// 画像の完全なURL
	const imageUrl = image && (image.startsWith('http') ? image : `${baseUrl}/${removeLeadingSlash(image)}`) || `${baseUrl}/no_blue.png`;

	return {
		title: metaTitle,
		description,
		icons: {
			icon: 'https://reamkf.github.io/wiki-nanodesu/no_blue.png',
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
