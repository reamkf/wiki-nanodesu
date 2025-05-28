import { getFriendsData } from "@/data/friendsData";
import { notFound } from "next/navigation";
import { getFullName } from "@/utils/friends/friends";

export async function generateStaticParams() {
	const friendsData = await getFriendsData();
	return friendsData.map((friend) => ({
		friendsName: encodeURIComponent(getFullName(friend)),
	}));
}

interface FriendsPageProps {
	params: {
		friendsName: string;
	};
}

export default async function FriendsPage({ params }: FriendsPageProps) {
	const friendsName = decodeURIComponent(params.friendsName || '');

	const friendsData = await getFriendsData();
	const friendsDataRow = friendsData.find(
		(friend) => getFullName(friend) === friendsName
	);

	if (!friendsDataRow) {
		notFound();
	}

	return (
		<>
			フレンズ名: {friendsDataRow?.name || 'Unknown'}<br />
			属性: {friendsDataRow?.attribute || 'Unknown'}
		</>
	);
}
