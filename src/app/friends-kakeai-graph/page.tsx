import React from 'react';
import { getFriendsKakeaiData } from '@/utils/friendsKakeaiData';
import FriendsKakeaiGraphPage from '@/app/friends-kakeai-graph/FriendsKakeaiGraphPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'フレンズ掛け合いグラフ - アプリ版けものフレンズ３wikiなのです',
	description: 'フレンズ掛け合いグラフ',
};

export default async function Page() {
	const graphData = await getFriendsKakeaiData();

	return <FriendsKakeaiGraphPage initialData={graphData} />;
}