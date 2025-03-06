import { generateMetadata } from '../metadata';
import React from 'react';
import { getFriendsKakeaiData } from '@/utils/friendsKakeaiData';
import FriendsKakeaiGraphPage from '@/app/friends-kakeai-graph/FriendsKakeaiGraphPage';

export const metadata = generateMetadata({
	title: 'フレンズ掛け合いグラフ'
});

export default async function Page() {
	const graphData = await getFriendsKakeaiData();

	return <FriendsKakeaiGraphPage initialData={graphData} />;
}