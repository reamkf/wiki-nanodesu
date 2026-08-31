const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatEventDate(value: string): string {
	const dateValue = value.trim();
	if (!dateValue || dateValue === "-") return "-";

	const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/.exec(dateValue);
	if (!match) return dateValue;

	const [, year, month, day, hour, minute] = match;
	const date = new Date(Number(year), Number(month) - 1, Number(day));
	const formattedDate = `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}(${WEEKDAYS[date.getDay()]})`;
	return hour && minute ? `${formattedDate} ${hour.padStart(2, "0")}:${minute}` : formattedDate;
}
