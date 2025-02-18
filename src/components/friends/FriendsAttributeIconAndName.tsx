import { SeesaaWikiImage } from "@/components/SeesaaWikiImage";
import { FriendsAttribute, friendsAttributeColor, friendsAttributeIconUrl } from "@/types/friends";

interface FriendsAttributeIconAndNameProps {
	attribute: FriendsAttribute;
}

export function FriendsAttributeIconAndName({ attribute }: FriendsAttributeIconAndNameProps) {
	const textColor = friendsAttributeColor[attribute];
	const iconUrl = friendsAttributeIconUrl[attribute];

	return (
		<>
			<div
				style={{ color: textColor }}
				className="flex flex-col items-center"
			>
				<span className="text-[11px] font-bold">{attribute}</span>
				<SeesaaWikiImage
					src={iconUrl}
					alt={attribute}
					width={40}
					height={40}
				/>
			</div>
		</>
	);
}
