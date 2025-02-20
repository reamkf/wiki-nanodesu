import { FriendsDataRow } from "@/types/friends";

export function isHc(friendsDataRow: FriendsDataRow): boolean {
	return friendsDataRow.id.match(/\((赤|青|緑|桃|水|黄緑)\)$/) !== null;
}
