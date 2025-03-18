import { FriendsAttribute, FriendsAttributeOrder } from "@/types/friends";

export function sortFriendsAttribute(attributeA: FriendsAttribute, attributeB: FriendsAttribute): number {
	return FriendsAttributeOrder[attributeB] - FriendsAttributeOrder[attributeA];
}
