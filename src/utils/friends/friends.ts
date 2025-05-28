import { FriendsAttribute, FriendsDataRow } from "@/types/friends";
import { PhotoAttribute } from "@/types/photo";

export const AttributeOrder = {
	[FriendsAttribute.friendry]: 0,
	[FriendsAttribute.funny]: 1,
	[FriendsAttribute.relax]: 2,
	[FriendsAttribute.active]: 3,
	[FriendsAttribute.lovely]: 4,
	[FriendsAttribute.mypace]: 5,
	[PhotoAttribute.footprint]: 6,
	[PhotoAttribute.blue]: 7,
	[PhotoAttribute.none]: 8,
}

export function sortAttribute(attributeA: FriendsAttribute | PhotoAttribute, attributeB: FriendsAttribute | PhotoAttribute): number {
	return AttributeOrder[attributeB] - AttributeOrder[attributeA];
}

export function getFullName(friends: FriendsDataRow): string {
	return friends.secondName ? `【${friends.secondName}】${friends.name}` : friends.name;
}
