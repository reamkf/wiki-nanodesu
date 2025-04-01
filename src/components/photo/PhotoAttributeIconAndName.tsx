import Image from "next/image";
import { PhotoAttribute, photoAttributeColor, photoAttributeIconUrl } from "@/types/photo";
import { memo } from "react";

interface PhotoAttributeIconAndNameProps {
	attribute: PhotoAttribute;
}

export const PhotoAttributeIconAndName = memo(function PhotoAttributeIconAndName({ attribute }: PhotoAttributeIconAndNameProps) {
	if(attribute === PhotoAttribute.none) {
		return '-';
	}
	const textColor = photoAttributeColor[attribute];
	const iconUrl = photoAttributeIconUrl[attribute];

	return (
		<>
			<div
				style={{ color: textColor }}
				className="flex flex-col items-center"
			>
				<span className="text-[11px] font-bold">{attribute}</span>
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
