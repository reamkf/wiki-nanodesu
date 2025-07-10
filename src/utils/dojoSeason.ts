const BASE_DATE = new Date('2020-08-01T00:00:00Z');  // UTC
const BASE_COUNT = 2;

export function getJSTDate(date: Date) {
	// UTCの時刻に9時間を加算してJSTに変換（ミリ秒単位で計算）
	const jstTime = date.getTime() + (9 * 60 * 60 * 1000);
	const jstDate = new Date(jstTime);

	// 日本時間の年月日を取得して、新しいDateオブジェクトを作成
	return new Date(Date.UTC(
		jstDate.getUTCFullYear(),
		jstDate.getUTCMonth(),
		jstDate.getUTCDate()
	));
}

export function calculateSeasonCount(dateTimeJST: Date) {
	// 基準日からの月数を計算
	const baseYear = BASE_DATE.getUTCFullYear();
	const baseMonth = BASE_DATE.getUTCMonth();

	const currentYear = dateTimeJST.getUTCFullYear();
	const currentMonth = dateTimeJST.getUTCMonth();

	// 経過した月数を計算
	const monthsDiff = (currentYear - baseYear) * 12 + (currentMonth - baseMonth);

	// 偶数月の数を計算（基準月を0として）
	const evenMonthsPassed = Math.floor(monthsDiff / 2);

	// 現在のカウントを計算
	return BASE_COUNT + evenMonthsPassed;
}

export function getCurrentSeasonCount() {
	const currentJST = getJSTDate(new Date());
	return calculateSeasonCount(currentJST);
}