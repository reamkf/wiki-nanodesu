import { PhotoAttributeIcon } from "@/components/photo/PhotoAttributeIconAndName";
import { FriendsDataRow } from "@/types/friends";
import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";
import { DetailCard, DetailField, DetailSection } from "./DetailParts";

function renderText(text: string): React.ReactNode {
	return text ? parseSeesaaWikiText(text) : "-";
}

export function FriendsWildPhoto({
	friend,
	showTitle = true,
}: {
	friend: FriendsDataRow;
	showTitle?: boolean;
}) {
	const body = (
		<DetailCard className="max-w-4xl">
			<div className="grid gap-4 text-sm md:grid-cols-[auto_1fr_auto_1fr] md:items-center">
				<DetailField label="属性">
					<PhotoAttributeIcon attribute={friend.wildPhotoAttribute} />
				</DetailField>
				<DetailField label="とくせい効果（変化前）">
					{renderText(friend.wildPhotoTrait)}
				</DetailField>
				<div
					aria-hidden="true"
					className="hidden text-center text-2xl font-bold text-gray-300 md:block"
				>
					→
				</div>
				<DetailField label="とくせい効果（変化後）">
					{renderText(friend.wildPhotoTraitChanged)}
				</DetailField>
			</div>
		</DetailCard>
	);

	// 比較ページでは見出しなしのカードだけを使う
	if (!showTitle) {
		return body;
	}

	return (
		<DetailSection title="動物フォト" id="wild-photo">
			{body}
		</DetailSection>
	);
}
