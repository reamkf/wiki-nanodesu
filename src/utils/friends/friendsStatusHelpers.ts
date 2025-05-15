import { FriendsStatusListItemWithDisplayValue } from "@/utils/friends/friendsStatus";

export const STATUS_TYPES = [
	"☆6/Lv200/野生4",
	"☆6/Lv200/野生5",
	"☆6/Lv99/野生4",
	"☆6/Lv99/野生5",
	"☆6/Lv90/野生4",
	"☆6/Lv90/野生5",
] as const;

/**
 * 検索用のテキストを取得する
 */
export function getSearchableText(
	row: FriendsStatusListItemWithDisplayValue,
	columnId: string
): string {
	switch (columnId) {
		case "name":
		case "icon":
			return row.friendsDataRow.secondName
				? `${row.friendsDataRow.secondName} ${row.friendsDataRow.name}`
				: row.friendsDataRow.name;
		case "attribute":
			return row.friendsDataRow.attribute;
		default:
			return (
				row.displayValues[columnId as keyof typeof row.displayValues] ?? ""
			);
	}
}

/**
 * ステータスタイプでフィルタリングおよびソートされたデータを取得する
 */
export function sortAndFilterFriendsList(
	data: FriendsStatusListItemWithDisplayValue[],
	selectedStatusTypes: Set<string>,
	hideNullStatus: boolean,
	sortBy: string = "kemosute",
	sortDesc: boolean = true,
	showCostumeBonus: boolean = false
): FriendsStatusListItemWithDisplayValue[] {
	const filtered = data.filter((item) => {
		if (
			hideNullStatus &&
			[item.status.hp, item.status.atk, item.status.def].some(
				(status) => status === null
			)
		) {
			return false;
		}
		return selectedStatusTypes.has(item.statusType);
	});

	return [...filtered].sort((a, b) => {
		let valueA: number, valueB: number;

		if (sortBy === "kemosute") {
			valueA = showCostumeBonus ? a.sortValues.kemosuteWithCostume : a.sortValues.kemosute;
			valueB = showCostumeBonus ? b.sortValues.kemosuteWithCostume : b.sortValues.kemosute;
		} else if (sortBy === "hp") {
			valueA = showCostumeBonus ? a.sortValues.hpWithCostume : a.sortValues.hp;
			valueB = showCostumeBonus ? b.sortValues.hpWithCostume : b.sortValues.hp;
		} else if (sortBy === "atk") {
			valueA = showCostumeBonus ? a.sortValues.atkWithCostume : a.sortValues.atk;
			valueB = showCostumeBonus ? b.sortValues.atkWithCostume : b.sortValues.atk;
		} else if (sortBy === "def") {
			valueA = showCostumeBonus ? a.sortValues.defWithCostume : a.sortValues.def;
			valueB = showCostumeBonus ? b.sortValues.defWithCostume : b.sortValues.def;
		} else if (sortBy === "avoid") {
			valueA = a.sortValues.avoid;
			valueB = b.sortValues.avoid;
		} else if (sortBy === "attribute") {
			// 属性での比較は特殊処理が必要なためスキップ
			return 0;
		} else {
			// 文字列の場合はここでは単純比較
			if (typeof a.sortValues.name === 'string' && typeof b.sortValues.name === 'string') {
				return sortDesc
					? b.sortValues.name.localeCompare(a.sortValues.name)
					: a.sortValues.name.localeCompare(b.sortValues.name);
			}
			return 0;
		}

		// 数値の比較
		if (isNaN(valueA) || valueA === null || valueA === undefined) valueA = -Infinity;
		if (isNaN(valueB) || valueB === null || valueB === undefined) valueB = -Infinity;

		return sortDesc ? valueB - valueA : valueA - valueB;
	});
}