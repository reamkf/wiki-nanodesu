import React from 'react';
import { processKakeaiData } from '@/utils/friends-kakeai-graph/data-processor';
import FriendsKakeaiGraphPage from '@/app/friends-kakeai-graph/FriendsKakeaiGraphPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'フレンズ掛け合い関係グラフ - アプリ版けものフレンズ３wikiなのです',
	description: 'けものフレンズ３のフレンズ間の掛け合い関係を可視化したグラフです。',
};

export default async function Page() {
	const graphData = await processKakeaiData();

	return <FriendsKakeaiGraphPage initialData={graphData} />;
}