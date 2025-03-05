'use client';

import React, { useState, useRef, useEffect } from 'react';
import FriendsGraph from '@/components/friends-kakeai-graph/FriendsGraph';
import GraphControls from '@/components/friends-kakeai-graph/GraphControls';
import { GraphData } from '@/types/friends-kakeai-graph';
import { Typography, Box, Alert } from '@mui/material';
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
		// ブラウザのローカルストレージに選択したフレンズIDを保存
		if (typeof window !== 'undefined') {
			localStorage.setItem('wiki-nanodesu.FriendsKakeaiGraph.selectedFriendId', friendId);
		}

		// 選択したフレンズのノード要素にフォーカス
		const nodeElement = document.querySelector(`[data-friend-id="${friendId}"]`);
		if (nodeElement) {
			nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	// ローカルストレージから選択したフレンズIDを取得
	useEffect(() => {
		if (typeof window !== 'undefined' && !isEmptyData) {
			const selectedFriendId = localStorage.getItem('wiki-nanodesu.FriendsKakeaiGraph.selectedFriendId');
			if (selectedFriendId) {
				const friendExists = graphData.nodes.some(node => node.id === selectedFriendId);
				if (friendExists) {
					handleSelectFriend(selectedFriendId);
				}
			}
		}
	}, [graphData, isEmptyData]);

	return (
		<>
			<PageTitle title="フレンズ掛け合い関係グラフ" />

			<Box className="mb-6">
				<Typography variant="body1" component="p" className="mb-2">
					フレンズの掛け合い関係を可視化したグラフです。
				</Typography>
				<Alert severity="warning">
					※グループは自動検出しているため、必ずしも正確なものではありません。
				</Alert>
			</Box>

			{isEmptyData ? (
				<Alert severity="error" className="mb-4">
					データの読み込みに失敗しました。ページを再読み込みするか、しばらく時間をおいてからアクセスしてください。
				</Alert>
			) : (
				<>
					<Box ref={graphRef} className="mb-4">
						<FriendsGraph data={graphData} onSelectFriend={handleSelectFriend} />
					</Box>

					<Box className="mb-6">
						<GraphControls
							nodes={graphData.nodes}
							onSelectFriend={handleSelectFriend}
						/>
					</Box>
				</>
			)}
		</>
	);
};

export default FriendsKakeaiGraphPage;