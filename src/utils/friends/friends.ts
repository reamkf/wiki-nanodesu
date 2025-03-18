import { FriendsAttribute, FriendsAttributeOrder } from "@/types/friends";
import { PhotoAttribute } from "@/types/photo";

export function sortFriendsAttribute(attributeA: FriendsAttribute | PhotoAttribute, attributeB: FriendsAttribute | PhotoAttribute): number {
	return FriendsAttributeOrder[attributeB] - FriendsAttributeOrder[attributeA];
}
