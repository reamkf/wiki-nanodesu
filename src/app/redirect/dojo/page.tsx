'use client';

import Redirect from '@/components/Redirect';
import { getWikiNanodaPageUrl } from '@/utils/seesaaWiki';

/**
 * wikiなのだへ道場ページへのリダイレクトページ
 */
export default function WikiNanodaRedirectPage() {
	const currentSeasonCOunt = getLatestDojoSeasonCount();
	const pageName = `シーサーバル道場（β2-${currentSeasonCOunt}）`

	const redirectUrl = getWikiNanodaPageUrl(pageName);
	const message = 'wikiなのだの最新の道場ページへ移動しています...';

	return (
		<Redirect
			to={redirectUrl}
			message={message}
		/>
	);
}

/**
 * 最新の道場シーズン数を取得する
 * @returns 最新の道場シーズン数
 */
function getLatestDojoSeasonCount(): number {
	const SEASON_COUNT_BASE = 2;
	const SEASON_BASE_YEAR = 2020;
	const SEASON_BASE_MONTH = 8;

	// 日本時間（JST）で現在の日付を取得
	const now = new Date();
	// UTCでの時間を取得し、日本時間（UTC+9）に調整
	const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);

	const currentYear = jstDate.getUTCFullYear();
	const currentMonth = jstDate.getUTCMonth();

	return ((currentYear - SEASON_BASE_YEAR) * 12 + currentMonth - SEASON_BASE_MONTH) / 2 + SEASON_COUNT_BASE;
}