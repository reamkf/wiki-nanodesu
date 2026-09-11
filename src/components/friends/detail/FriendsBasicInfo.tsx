import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import FriendsIcon from "@/components/friends/FriendsIcon";
import { NanodesuLink } from "@/components/common/NanodesuLink";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { FriendsAttribute, FriendsDataRow } from "@/types/friends";
import { getWikiNanodaPageUrl } from "@/utils/wikiNanodaUrl";

function friendPath(id: string): string {
	return `/friends/${encodeURIComponent(id)}`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-gray-100 py-1">
			<dt className="font-semibold text-gray-600">{label}</dt>
			<dd>{value || "-"}</dd>
		</div>
	);
}

export function FriendsBasicInfo({ friend }: { friend: FriendsDataRow }) {
	const wikiUrl = friend.wikiPageUrl || getWikiNanodaPageUrl(friend.id);

	return (
		<section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
			<div className="flex flex-wrap items-start gap-4">
				<FriendsIcon friendsData={friend} size={160} />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-gray-500">
						{friend.secondName || "フレンズ"}
					</p>
					<h1 className="text-2xl font-bold text-gray-900">{friend.name}</h1>
					<div className="mt-2 flex flex-wrap items-end gap-3">
						{friend.attribute !== FriendsAttribute.none && (
							<FriendsAttributeIconAndName attribute={friend.attribute} />
						)}
						{friend.subAttribute !== FriendsAttribute.none && (
							<FriendsAttributeIconAndName attribute={friend.subAttribute} />
						)}
					</div>
				</div>
			</div>

			<dl className="mt-4 text-sm">
				<InfoRow label="初期けも級" value={`☆${friend.rarity}`} />
				<InfoRow label="CV" value={friend.cv} />
				<InfoRow label="実装日" value={friend.implementDate} />
				<InfoRow
					label="実装種別"
					value={
						friend.implementTypeDetail
							? `${friend.implementType}（${friend.implementTypeDetail}）`
							: friend.implementType
					}
				/>
				<InfoRow label="野生大解放" value={friend.hasYasei5 ? "あり" : "なし"} />
				<InfoRow label="12ポケ" value={friend.has12poke ? "あり" : "なし"} />
				<InfoRow label="特別衣装" value={`${friend.numOfClothes}着`} />
			</dl>

			<div className="mt-4 flex flex-wrap gap-4">
				<NanodesuLink href={friendPath(friend.id)}>このサイトで見る</NanodesuLink>
				<SeesaaWikiLink href={wikiUrl}>既存Wikiで見る</SeesaaWikiLink>
			</div>
		</section>
	);
}
