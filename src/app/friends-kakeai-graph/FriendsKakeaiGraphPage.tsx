'use client';

import React, { useState, useRef } from 'react';
import FriendsGraph from '@/components/friends-kakeai-graph/FriendsGraph';
import { GraphData } from '@/types/friends-kakeai-graph';
import { Box, Alert } from '@mui/material';
import { PageTitle } from '@/components/PageTitle';

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
				<Alert severity="warning" className="w-fit">
					グループは自動で検出しているため、必ずしも正確ではない可能性があります。
				</Alert>
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