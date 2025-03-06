import React from 'react';
import { processKakeaiData } from '@/utils/friends-kakeai-graph/data-processor';
import FriendsKakeaiGraphPage from '@/app/friends-kakeai-graph/FriendsKakeaiGraphPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'フレンズ掛け合いグラフ - アプリ版けものフレンズ３wikiなのです',
	description: 'フレンズ掛け合いグラフ',
};

export default async function Page() {
	const graphData = await processKakeaiData();

	return <FriendsKakeaiGraphPage initialData={graphData} />;
}