import { PhotoDataRow } from "@/types/photo";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { getWikiNanodaPageUrl } from '@/utils/seesaaWiki';
import { memo } from "react";

interface PhotoNameLinkProps {
	photo: PhotoDataRow;
	isChanged?: boolean;
}

export const PhotoNameLink = memo(function PhotoNameLink({ photo, isChanged }: PhotoNameLinkProps) {
	const pageUrl = getWikiNanodaPageUrl(photo.name);
	return (
		<div className="flex flex-col">
			<div className="text-xs text-gray-600 space-x-1">
				<span>☆{photo.rarity}</span>
				{isChanged !== undefined && (isChanged ? <span className="text-pink-500">[変化後]</span> : <span>[変化前]</span>)}
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
