import Image from "next/image";
import { FriendsAttribute, friendsAttributeColor, friendsAttributeIconUrl } from "@/types/friends";
import { memo } from "react";

interface FriendsAttributeIconAndNameProps {
	attribute: FriendsAttribute;
}

export const FriendsAttributeIconAndName = memo(function FriendsAttributeIconAndName({ attribute }: FriendsAttributeIconAndNameProps) {
	const textColor = friendsAttributeColor[attribute];
	const iconUrl = friendsAttributeIconUrl[attribute];

	return (
		<>
			<div
				style={{ color: textColor }}
				className="flex flex-col items-center"
			>
				<span className="text-[11px] font-bold text-center">{attribute}</span>
				<Image
					src={iconUrl}
					alt={attribute}
					width={40}
					height={40}
				/>
			</div>
		</>
	);
});
