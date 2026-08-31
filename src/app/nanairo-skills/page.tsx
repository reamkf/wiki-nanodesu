import { generateMetadata } from "../metadata";
import { getFriendsData } from "@/data/friendsData";
import { FriendsDataRow } from "@/types/friends";
import { PageTitle } from "@/components/PageTitle";
import { Heading } from "@/components/section/Heading";
import { TableOfContents } from "@/components/section/TableOfContents";
import { TreeItemData } from "@/components/common/TreeList";
import NanairoTable from "./page.client";

export const metadata = generateMetadata({
	title: "なないろとくせい一覧",
});

const TABLE_OF_CONTENTS: TreeItemData[] = [
	{ id: "nanairo-implemented", name: "なないろとくせい一覧" },
	{ id: "nanairo-unimplemented", name: "なないろとくせい未実装フレンズ一覧" },
];

function hasNanairoSkill(friend: FriendsDataRow): boolean {
	const effect = friend.nanairoSkillEffect.trim();
	return effect !== "" && effect !== "未実装";
}

function sortByListIndex(data: FriendsDataRow[]): FriendsDataRow[] {
	return [...data].sort((a, b) => a.listIndex - b.listIndex);
}

export default async function NanairoSkillsPage() {
	const friendsData = sortByListIndex(await getFriendsData());
	const implementedFriends = friendsData.filter(hasNanairoSkill);
	const unimplementedFriends = friendsData.filter(
		(friend) =>
			!hasNanairoSkill(friend) &&
			(friend.rarity === 4 || friend.implementType === "ゲスト専用"),
	);

	return (
		<div className="min-h-screen">
			<PageTitle title="なないろとくせい一覧" />
			<TableOfContents contents={TABLE_OF_CONTENTS} />

			<section className="mb-8">
				<Heading title="なないろとくせい一覧" id="nanairo-implemented" level={1} />
				<NanairoTable data={implementedFriends} tableId="nanairo-skills" showEffect />
			</section>

			<section>
				<Heading
					title="なないろとくせい未実装フレンズ一覧"
					id="nanairo-unimplemented"
					level={1}
				/>
				<NanairoTable
					data={unimplementedFriends}
					tableId="nanairo-skills-unimplemented"
					showEffect={false}
				/>
			</section>
		</div>
	);
}
