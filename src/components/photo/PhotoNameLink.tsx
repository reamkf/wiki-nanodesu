import { PhotoDataRow } from "@/types/photo";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { getWikiNanodaPageUrl } from '@/utils/seesaawiki/encoding';
import { memo } from "react";

interface PhotoNameLinkProps {
	photo: PhotoDataRow;
	isChanged?: boolean;
}

export const PhotoNameLink = memo(function PhotoNameLink({ photo, isChanged }: PhotoNameLinkProps) {
	const pageUrl = getWikiNanodaPageUrl(photo.name);
	return (
		<div className="flex flex-col">
			<SeesaaWikiLink
				href={pageUrl}
				className="block text-md"
			>
				<div className="text-xs text-gray-600 space-x-1 flex items-center">
					<span>☆{photo.rarity}</span>
					{isChanged !== undefined && (
						isChanged ?
							<span className="bg-pink-100 text-pink-500 px-[4px] py-[2px] text-[0.6rem] rounded-sm">変化後</span>
						:   <span className="bg-gray-100 text-gray-700 px-[4px] py-[2px] text-[0.6rem] rounded-sm">変化前</span>
					)}
				</div>
				{photo.name}
			</SeesaaWikiLink>
		</div>
	);
});
