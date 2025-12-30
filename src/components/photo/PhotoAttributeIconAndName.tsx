import Image from "next/image";
import { PhotoAttribute, photoAttributeColor, photoAttributeIconUrl } from "@/types/photo";
import { memo } from "react";

interface PhotoAttributeIconAndNameProps {
	attribute: PhotoAttribute;
	showText?: boolean;
	size?: number;
}

export const PhotoAttributeIcon = memo(function PhotoAttributeIconAndName({ attribute, showText = true, size = 40 }: PhotoAttributeIconAndNameProps) {
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
				{showText && <span className="text-[11px] font-bold">{attribute}</span>}
				<Image
					src={iconUrl}
					alt={attribute}
					width={size}
					height={size}
				/>
			</div>
		</>
	);
});
