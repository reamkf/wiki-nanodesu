import { PhotoDataRow } from "@/types/photo";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { getWikiNanodaPageUrl } from '@/utils/seesaaWiki';
import { memo } from "react";

interface PhotoNameLinkProps {
	photo: PhotoDataRow;
}

export const PhotoNameLink = memo(function PhotoNameLink({ photo }: PhotoNameLinkProps) {
	const pageUrl = getWikiNanodaPageUrl(photo.name);
	return (
		<div className="flex flex-col">
			<div className="text-xs text-gray-600">
				☆{photo.rarity}
			</div>
			<SeesaaWikiLink
				href={pageUrl}
				className="block text-md"
			>
				{photo.name}
			</SeesaaWikiLink>
		</div>
	);
});
