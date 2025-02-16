import FriendsDataTable from "@/components/FriendsDataTable";
import { PageTitle } from "@/components/PageTitle";
import { getFriendsData } from "@/utils/friends";
import type { GetStaticPropsContext } from "next";

export default async function FriendsStatus() {
	const data = await getFriendsData({} as GetStaticPropsContext);
	if (!('props' in data)) {
		throw new Error('Invalid data structure');
	}

	return (
		<main className="p-4">
			<PageTitle title="フレンズステータスランキング" />
			<p className="mb-4 text-xl font-bold">
				※このページは製作途中です。
			</p>
			<FriendsDataTable friendsData={data.props.friends} />
		</main>
	);
}
