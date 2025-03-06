'use client';

import React, { useState, useRef } from 'react';
import FriendsGraph from '@/components/friends-kakeai-graph/FriendsGraph';
import { GraphData } from '@/types/friends-kakeai-graph';
import { Box, Alert } from '@mui/material';
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from '@/components/seesaawiki/SeesaaWikiLink';

interface FriendsKakeaiGraphPageProps {
	initialData: GraphData;
}

const FriendsKakeaiGraphPage: React.FC<FriendsKakeaiGraphPageProps> = ({ initialData }) => {
	const [graphData] = useState<GraphData>(initialData);
	const graphRef = useRef<HTMLDivElement>(null);

	// データが空かどうか確認
	const isEmptyData = graphData.nodes.length === 0 || graphData.links.length === 0;

	// 特定のフレンズを選択したときの処理
	const handleSelectFriend = (friendId: string) => {
		// 選択されたフレンズのノードを見つける
		const selectedNode = graphData.nodes.find(node => node.id === friendId);

		// linkUrlが存在する場合、新しいタブで開く
		if (selectedNode?.linkUrl) {
			window.open(selectedNode.linkUrl, '_blank');
		}
	};

	return (
		<Box>
			<PageTitle title="フレンズ掛け合いグラフ" />

			<Box className="mb-2">
				掛け合い一覧表は
				<SeesaaWikiLink href="https://seesaawiki.jp/kemono_friends3_5ch/d/%A5%D5%A5%EC%A5%F3%A5%BA%B3%DD%A4%B1%B9%E7%A4%A4%B0%EC%CD%F7" className="text-sky-700">
					こちら
				</SeesaaWikiLink>
			</Box>

			{isEmptyData ? (
				<Alert severity="error" className="mb-2">
					データの読み込みに失敗しました。ページを再読み込みするか、しばらく時間をおいてからアクセスしてください。
				</Alert>
			) : (
				<>
					<Box
						ref={graphRef}
						className="relative bg-gray-100 border border-gray-300 border-4 rounded-lg"
					>
						<FriendsGraph data={graphData} onSelectFriend={handleSelectFriend} />
					</Box>
				</>
			)}
		</Box>
	);
};

export default FriendsKakeaiGraphPage;