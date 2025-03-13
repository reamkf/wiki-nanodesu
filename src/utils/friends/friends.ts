import { FriendsAttribute, FriendsAttributeOrder, FriendsDataRow } from "@/types/friends";

export function sortFriendsAttribute(attributeA: FriendsAttribute, attributeB: FriendsAttribute): number {
	return FriendsAttributeOrder[attributeA] - FriendsAttributeOrder[attributeB];
}
