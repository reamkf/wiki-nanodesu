import { generateMetadata } from "../../metadata";
import { getFriendsData } from "@/data/friendsData";
import FriendsCompare from "./page.client";

export const metadata = generateMetadata({
	title: "フレンズ比較",
	description: "2人のフレンズのステータス、スキル、基本情報を比較するページ",
	path: "/friends/compare",
});

export default async function FriendsComparePage() {
	const friends = await getFriendsData();
	return <FriendsCompare friends={friends} />;
}
