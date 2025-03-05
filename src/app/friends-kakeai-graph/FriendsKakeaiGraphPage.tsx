'use client';

import React, { useState, useRef, useEffect } from 'react';
import FriendsGraph from '@/components/friends-kakeai-graph/FriendsGraph';
import GraphControls from '@/components/friends-kakeai-graph/GraphControls';
import { GraphData } from '@/types/friends-kakeai-graph';
import { Card, CardContent, Typography, Box, Container, Alert } from '@mui/material';

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

	// グループに関する統計情報を計算
	const groupStats = React.useMemo(() => {
		const groups = new Map<number, number>();

		graphData.nodes.forEach(node => {
			if (node.group) {
				const groupCount = groups.get(node.group) || 0;
				groups.set(node.group, groupCount + 1);
			}
		});

		const groupSizes = Array.from(groups.entries()).map(([, count]) => count);
		const largestGroup = groupSizes.length > 0 ? Math.max(...groupSizes) : 0;

		return {
			totalGroups: groups.size,
			totalNodes: graphData.nodes.length,
			totalLinks: graphData.links.length,
			largestGroup: largestGroup,
		};
	}, [graphData]);

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
		<Container maxWidth="xl" className="py-6">
			<Typography variant="h4" component="h1" className="mb-4 font-bold text-center">
				フレンズ掛け合い関係グラフ
			</Typography>

			<Box className="mb-6">
				<Typography variant="body1" component="p" className="mb-2 text-center">
					けものフレンズ３に登場するフレンズ間の掛け合い関係を可視化したグラフです。
				</Typography>
				<Typography variant="body2" component="p" className="text-center text-gray-600">
					※ 線でつながれたフレンズ同士が掛け合いを持っていることを表しています。同じ色の枠で囲まれたフレンズはお互いに関連のあるグループです。
				</Typography>
			</Box>

			{isEmptyData ? (
				<Alert severity="error" className="mb-4">
					データの読み込みに失敗しました。ページを再読み込みするか、しばらく時間をおいてからアクセスしてください。
				</Alert>
			) : (
				<>
					<Box className="mb-4">
						<Card variant="outlined">
							<CardContent>
								<div className="flex flex-wrap justify-center gap-4 text-sm">
									<div>
										<span className="font-medium">総フレンズ数:</span> {graphData.nodes.length}
									</div>
									<div>
										<span className="font-medium">総掛け合い数:</span> {graphData.links.length}
									</div>
									<div>
										<span className="font-medium">グループ数:</span> {groupStats.totalGroups}
									</div>
									<div>
										<span className="font-medium">最大グループサイズ:</span> {groupStats.largestGroup}フレンズ
									</div>
								</div>
							</CardContent>
						</Card>
					</Box>

					<Box className="mb-6">
						<GraphControls
							nodes={graphData.nodes}
							onSelectFriend={handleSelectFriend}
						/>
					</Box>

					<Box ref={graphRef} className="mb-4">
						<FriendsGraph data={graphData} onSelectFriend={handleSelectFriend} />
					</Box>
				</>
			)}

			<Box className="mt-8">
				<Typography variant="body2" component="p" className="text-center text-gray-500">
					※ データは定期的に更新されます。最終更新: {new Date().toLocaleDateString('ja-JP')}
				</Typography>
			</Box>
		</Container>
	);
};

export default FriendsKakeaiGraphPage;