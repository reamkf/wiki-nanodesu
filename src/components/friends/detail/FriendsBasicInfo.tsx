import Link from "next/link";
import { FriendsAttributeIconAndName } from "@/components/friends/FriendsAttributeIconAndName";
import FriendsIcon from "@/components/friends/FriendsIcon";
import { FriendsAttribute, FriendsDataRow } from "@/types/friends";
import { getWikiNanodaPageUrl } from "@/utils/wikiNanodaUrl";

// プロフィール項目の1マス
function HeroMeta({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-xs font-semibold text-gray-500">{label}</dt>
			<dd className="mt-0.5 text-sm font-semibold text-gray-900">{value || "-"}</dd>
		</div>
	);
}

// ページタイトルと基本情報を統合したプロフィールヘッダー
// フレンズ名の強調はここに一本化し、PageTitleとの重複を避ける
export function FriendsBasicInfo({ friend }: { friend: FriendsDataRow }) {
	const wikiUrl = friend.wikiPageUrl || getWikiNanodaPageUrl(friend.id);
	const implementType = friend.implementTypeDetail
		? `${friend.implementType}（${friend.implementTypeDetail}）`
		: friend.implementType;

	return (
		<section
			aria-label="プロフィール"
			className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
		>
			<div className="flex flex-wrap items-start gap-4">
				<FriendsIcon friendsData={friend} size={160} />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-gray-500">
						{friend.secondName || "フレンズ"}
					</p>
					<h1 className="text-2xl font-bold text-gray-900">{friend.name}</h1>
					<div className="mt-2 flex flex-wrap items-center gap-3">
						{friend.attribute !== FriendsAttribute.none && (
							<FriendsAttributeIconAndName attribute={friend.attribute} />
						)}
						{friend.subAttribute !== FriendsAttribute.none && (
							<FriendsAttributeIconAndName attribute={friend.subAttribute} />
						)}
						<span
							aria-label={`初期けも級 ${friend.rarity}`}
							className="text-lg font-bold tracking-widest text-amber-400"
						>
							{"★".repeat(friend.rarity)}
						</span>
					</div>

					<dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
						<HeroMeta label="CV" value={friend.cv} />
						<HeroMeta label="実装日" value={friend.implementDate} />
						<HeroMeta label="実装種別" value={implementType} />
						<HeroMeta label="特別衣装" value={`${friend.numOfClothes}着`} />
						<HeroMeta label="野生大解放" value={friend.hasYasei5 ? "あり" : "なし"} />
						<HeroMeta label="12ポケ" value={friend.has12poke ? "あり" : "なし"} />
					</dl>

					<div className="mt-4 flex flex-wrap gap-2">
						<Link
							href={`/friends/compare?left=${encodeURIComponent(friend.id)}`}
							className="inline-flex items-center rounded-md bg-[#2196f3] px-4 py-2 text-sm font-bold text-white hover:bg-[#1e88e5]"
						>
							比較する
						</Link>
						<Link
							href={wikiUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
						>
							既存Wikiで見る ↗
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
