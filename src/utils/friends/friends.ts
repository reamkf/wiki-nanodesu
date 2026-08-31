import { FriendsAttribute } from "@/types/friends";
import { PhotoAttribute } from "@/types/photo";

// 内部でのみ使用する属性順序マップ
const AttributeOrder = {
	[FriendsAttribute.friendry]: 0,
	[FriendsAttribute.funny]: 1,
	[FriendsAttribute.relax]: 2,
	[FriendsAttribute.active]: 3,
	[FriendsAttribute.lovely]: 4,
	[FriendsAttribute.mypace]: 5,
	[PhotoAttribute.footprint]: 6,
	[PhotoAttribute.blue]: 7,
	[PhotoAttribute.none]: 8,
};

export function isFriendsAttribute(value: unknown): value is FriendsAttribute {
	return Object.values(FriendsAttribute).some((attribute) => attribute === value);
}

export function isPhotoAttribute(value: unknown): value is PhotoAttribute {
	return Object.values(PhotoAttribute).some((attribute) => attribute === value);
}

export function isAttribute(value: unknown): value is FriendsAttribute | PhotoAttribute {
	return isFriendsAttribute(value) || isPhotoAttribute(value);
}

export function sortAttribute(
	attributeA: FriendsAttribute | PhotoAttribute,
	attributeB: FriendsAttribute | PhotoAttribute,
): number {
	return AttributeOrder[attributeB] - AttributeOrder[attributeA];
}
