import { Metadata } from 'next'
import FriendsStatusTable from "@/components/friends/FriendsStatusTable";
import { PageTitle } from "@/components/PageTitle";
import { getFriendsStatusList } from "@/utils/friendsStatus";

export const metadata: Metadata = {
	title: "フレンズステータスランキング - アプリ版けものフレンズ３wikiなのです🦉",
	description: "フレンズステータスランキング",
};

export default async function FriendsStatus() {
	const friendsStatusList = await getFriendsStatusList();

	return (
		<div>
			<PageTitle title="フレンズステータスランキング" />
			{/* <p className="mb-4 text-xl font-bold">
				※このページは製作途中です。
			</p> */}

			<p className="mb-4">
				<span className="flex items-center gap-2">
					<span className="italic text-gray-600 bg-red-200 inline-block px-1">斜体・赤背景</span>は推測値です。
				</span>
			</p>

			<FriendsStatusTable friendsStatusList={friendsStatusList} />
		</div>
	);
}
