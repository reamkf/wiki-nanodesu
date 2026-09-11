import { PhotoAttributeIcon } from "@/components/photo/PhotoAttributeIconAndName";
import { FriendsDataRow } from "@/types/friends";
import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";

function renderText(text: string): React.ReactNode {
	return text ? parseSeesaaWikiText(text) : "-";
}

export function FriendsWildPhoto({ friend }: { friend: FriendsDataRow }) {
	return (
		<section className="mb-6">
			<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">動物フォト</h2>
			<div className="grid max-w-4xl gap-3 rounded border border-gray-200 p-3 text-sm md:grid-cols-3">
				<div>
					<p className="font-semibold text-gray-600">属性</p>
					<PhotoAttributeIcon attribute={friend.wildPhotoAttribute} />
				</div>
				<div>
					<p className="font-semibold text-gray-600">とくせい効果（変化前）</p>
					<p>{renderText(friend.wildPhotoTrait)}</p>
				</div>
				<div>
					<p className="font-semibold text-gray-600">とくせい効果（変化後）</p>
					<p>{renderText(friend.wildPhotoTraitChanged)}</p>
				</div>
			</div>
		</section>
	);
}
