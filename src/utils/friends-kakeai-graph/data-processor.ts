import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { FriendNode, FriendLink, GraphData } from '../../types/friends-kakeai-graph';
import { getFriendsData } from '@/utils/friendsData';
import { getWikiNanodaPageUrl } from '../encoding';

// CSVファイルを読み込む関数
export const readCsvFile = <T>(filePath: string): Promise<T[]> => {
	return new Promise((resolve, reject) => {
		try {
			const csvPath = path.join(process.cwd(), filePath);
			const csvFile = fs.readFileSync(csvPath, 'utf-8');

			Papa.parse(csvFile, {
				header: true,
				skipEmptyLines: true,
				complete: (results) => {
					resolve(results.data as T[]);
				},
				error: (error: Error) => {
					reject(error);
				}
			});
		} catch (error) {
			reject(error);
		}
	});
};

// フレンズ間の掛け合いデータをグラフ構造に変換する関数
export const processKakeaiData = async (): Promise<GraphData> => {
	try {
		// CSVファイルから掛け合いデータを読み込む
		const kakeaiData = await readCsvFile<Record<string, string>>('csv/フレンズ掛け合い一覧.csv');

		// getFriendsData()関数を使用してフレンズデータを取得
		const friendsData = await getFriendsData();

		// フレンズIDをキーにフレンズ基本情報をマップする
		const friendsMap = new Map();
		friendsData.forEach(friend => {
			if (friend.id) {
				friendsMap.set(friend.id, friend);
			}
		});

		// ノードとリンクを格納する配列
		const nodes: Map<string, FriendNode> = new Map();
		const links: FriendLink[] = [];

		// 掛け合いデータからノードとリンクを作成
		kakeaiData.forEach(kakeai => {
			const sourceId = kakeai['掛け合い元'];
			if (!sourceId) return;

			// 掛け合い元のノード追加
			if (!nodes.has(sourceId)) {
				const friend = friendsData.find(friend => friend.id === sourceId);
				nodes.set(sourceId, {
					id: sourceId,
					name: friend?.name || sourceId,
					iconUrl: friend?.iconUrl || '',
					linkUrl: getWikiNanodaPageUrl(sourceId),
				});
			}

			// 掛け合い先のノード追加とリンク作成
			for (let i = 1; i <= 10; i++) {
				const targetId = kakeai[`掛け合い先${i}`];
				if (!targetId) continue;

				// 掛け合い先のノード追加
				if (!nodes.has(targetId)) {
					const friend = friendsData.find(friend => friend.id === targetId);
					nodes.set(targetId, {
						id: targetId,
						name: friend?.name || targetId,
						iconUrl: friend?.iconUrl || '',
						linkUrl: getWikiNanodaPageUrl(targetId),
					});
				}

				// リンク追加
				links.push({
					source: sourceId,
					target: targetId,
					value: 1
				});
			}
		});

		// BFSによるグループ検出
		const nodesArray = Array.from(nodes.values());
		detectGroups(nodesArray, links);

		return {
			nodes: nodesArray,
			links
		};
	} catch (error) {
		console.error('データ処理エラー:', error);
		// エラー時は空のデータを返す
		return {
			nodes: [],
			links: []
		};
	}
};

// BFSアルゴリズムでグループを検出する関数
const detectGroups = (nodes: FriendNode[], links: FriendLink[]): void => {
	// グラフ構造を作成
	const graph = new Map<string, string[]>();

	// 各ノードをグラフに追加
	nodes.forEach(node => {
		graph.set(node.id, []);
	});

	// リンクをグラフに追加
	links.forEach(link => {
		const sourceId = link.source.toString();
		const targetId = link.target.toString();

		const sourceNeighbors = graph.get(sourceId) || [];
		sourceNeighbors.push(targetId);
		graph.set(sourceId, sourceNeighbors);

		const targetNeighbors = graph.get(targetId) || [];
		targetNeighbors.push(sourceId);
		graph.set(targetId, targetNeighbors);
	});

	// BFSでグループ検出
	const visited = new Set<string>();
	let groupId = 0;

	// 全ノードを走査
	nodes.forEach(node => {
		if (!visited.has(node.id)) {
			groupId++;
			bfs(node.id, groupId, graph, visited, nodes);
		}
	});
};

// BFSアルゴリズム実装
const bfs = (
	startNodeId: string,
	groupId: number,
	graph: Map<string, string[]>,
	visited: Set<string>,
	nodes: FriendNode[]
): void => {
	const queue: string[] = [startNodeId];
	visited.add(startNodeId);

	// ノードにグループIDを設定
	const startNode = nodes.find(node => node.id === startNodeId);
	if (startNode) {
		startNode.group = groupId;
	}

	while (queue.length > 0) {
		const currentId = queue.shift()!;
		const neighbors = graph.get(currentId) || [];

		for (const neighborId of neighbors) {
			if (!visited.has(neighborId)) {
				visited.add(neighborId);
				queue.push(neighborId);

				// 隣接ノードにグループIDを設定
				const neighborNode = nodes.find(node => node.id === neighborId);
				if (neighborNode) {
					neighborNode.group = groupId;
				}
			}
		}
	}
};