import { getPageUrl } from 'seesaawiki-url';

/** けものフレンズ3 wiki（Seesaa Wiki）のベースURL */
export const WIKI_NANODA_BASE_URL = 'https://seesaawiki.jp/kemono_friends3_5ch';

/** ページ名から wiki の閲覧用フルURLを返す */
export function getWikiNanodaPageUrl(pageName: string): string {
	return getPageUrl(WIKI_NANODA_BASE_URL, pageName);
}
