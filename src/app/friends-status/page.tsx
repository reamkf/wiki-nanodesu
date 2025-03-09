import { generateMetadata } from "../metadata";
import FriendsStatusTable from "./page.client";
import { PageTitle } from "@/components/PageTitle";
import { getFriendsStatusList, ProcessedFriendsStatusListItem } from "@/utils/friends/friendsStatus";
import { STATUS_TYPES, getFilteredAndSortedData } from "@/utils/friends/friendsStatusHelpers";

export const metadata = generateMetadata({
	title: "フレンズステータスランキング",
});

// デフォルトのフィルタリングとソートをサーバー側で実行
async function getProcessedStatusList(): Promise<{
	allData: ProcessedFriendsStatusListItem[];
	filteredData: ProcessedFriendsStatusListItem[];
}> {
	const allData = await getFriendsStatusList();

	// デフォルトのフィルター設定
	const defaultStatusTypesSet = new Set(STATUS_TYPES);
	const hideNullStatus = false;
	const sortBy = "kemosute";
	const sortDesc = true;
	const showCostumeBonus = false;

	// サーバー側でフィルタリングとソートを実行
	const filteredData = getFilteredAndSortedData(
		allData,
		defaultStatusTypesSet,
		hideNullStatus,
		sortBy,
		sortDesc,
		showCostumeBonus
	);

	return { allData, filteredData };
}

export default async function FriendsStatus() {
	const { allData, filteredData } = await getProcessedStatusList();

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

			<FriendsStatusTable
				friendsStatusList={allData}
				preFilteredData={filteredData}
				defaultStatusTypes={Array.from(STATUS_TYPES)}
			/>
		</div>
	);
}
