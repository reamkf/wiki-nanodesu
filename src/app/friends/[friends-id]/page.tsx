import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FriendsDetail } from "@/components/friends/detail/FriendsDetail";
import { getFriendsData, getFriendsDataMap } from "@/data/friendsData";
import { generateMetadata as createMetadata } from "@/app/metadata";

interface FriendsPageProps {
	params: Promise<{ "friends-id": string }>;
}

export async function generateStaticParams() {
	const friends = await getFriendsData();
	const encoded = process.env.NODE_ENV === "development";
	return friends.map((friend) => ({
		"friends-id": encoded ? encodeURIComponent(friend.id) : friend.id,
	}));
}

function decodeFriendId(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export async function generateMetadata({ params }: FriendsPageProps): Promise<Metadata> {
	const { "friends-id": friendsId } = await params;
	const friend = (await getFriendsDataMap()).get(decodeFriendId(friendsId));

	if (!friend) {
		return createMetadata({ noIndex: true });
	}

	const title = friend.secondName ? `${friend.secondName} ${friend.name}` : friend.name;
	return createMetadata({
		title,
		description: `${friend.name}のステータス、スキル、基本情報`,
		image: friend.iconUrl,
		path: `/friends/${encodeURIComponent(friend.id)}`,
	});
}

export default async function FriendsPage({ params }: FriendsPageProps) {
	const { "friends-id": friendsId } = await params;
	const friend = (await getFriendsDataMap()).get(decodeFriendId(friendsId));

	if (!friend) {
		notFound();
	}

	return <FriendsDetail friend={friend} />;
}
