import { generateMetadata } from "../metadata";
import FriendsStatusTable from "./page.client";
import { PageTitle } from "@/components/PageTitle";
import { getFriendsStatusList } from "@/utils/friends/friendsStatus";
import { STATUS_TYPES, sortAndFilterFriendsList } from "@/utils/friends/friendsStatusHelpers";

export const metadata = generateMetadata({
	title: "フレンズステータスランキング",
});

// デフォルトのソートをサーバー側で実行
async function getSortedStatusList(){
	const allData = await getFriendsStatusList();

	const defaultStatusTypesSet = new Set(STATUS_TYPES);
	const hideNullStatus = false;
	const sortBy = "kemosute";
	const sortDesc = true;
	const showCostumeBonus = false;

	const sortedData = sortAndFilterFriendsList(
		allData,
		defaultStatusTypesSet,
		hideNullStatus,
		sortBy,
		sortDesc,
		showCostumeBonus
	);

	return sortedData;
}

export default async function FriendsStatus() {
	const sortedFriendsStatusList = await getSortedStatusList();

	return (
		<div>
			<PageTitle title="フレンズステータスランキング" />

			<p className="mb-4">
				<span className="flex items-center gap-2">
					<span className="italic text-gray-600 bg-red-200 inline-block px-1">斜体・赤背景</span>は推測値です。
				</span>
			</p>

			<FriendsStatusTable
				friendsStatusList={sortedFriendsStatusList}
				defaultStatusTypes={Array.from(STATUS_TYPES)}
			/>
		</div>
	);
}
