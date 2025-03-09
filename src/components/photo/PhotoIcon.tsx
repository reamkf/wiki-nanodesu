import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { PhotoDataRow } from "@/types/photo";

interface PhotoIconProps {
	photoData: PhotoDataRow;
	size: number;
}

export default function PhotoIcon({ photoData, size = 45 }: PhotoIconProps) {
	return (
		<SeesaaWikiImage
			src={photoData.iconUrl}
			alt={photoData.name}
			width={size}
			height={size}
			referrerPolicy="no-referrer"
		/>
	);
}