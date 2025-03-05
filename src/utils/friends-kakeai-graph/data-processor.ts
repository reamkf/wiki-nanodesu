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
					groups: [], // 空のグループ配列で初期化
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
						groups: [], // 空のグループ配列で初期化
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

		// 掛け合い関係を持つフレンズのIDを抽出
		const friendsWithLinks = new Set<string>();
		links.forEach(link => {
			friendsWithLinks.add(link.source.toString());
			friendsWithLinks.add(link.target.toString());
		});

		// 掛け合い関係を持つフレンズのノードだけを残す
		const filteredNodes = new Map<string, FriendNode>();
		nodes.forEach((node, id) => {
			if (friendsWithLinks.has(id)) {
				filteredNodes.set(id, node);
			}
		});

		// BFSによるグループ検出
		const nodesArray = Array.from(filteredNodes.values());
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

	// 循環を検出してグループを割り当てる
	detectCycles(nodes, graph);

	// 残りの未割り当てのノードに対しては、リンクごとに異なるグループを割り当てる
	assignGroupsToRemainingNodes(nodes, links);
};

// 循環（サイクル）を検出するアルゴリズム
const detectCycles = (nodes: FriendNode[], graph: Map<string, string[]>): void => {
	let groupId = 0;

	// 最小の循環（三角形など）を見つける
	const cycles = findMinimalCycles(graph);

	// 検出された循環ごとに新しいグループを作成
	cycles.forEach(cycle => {
		if (cycle.size >= 3) { // 3つ以上のノードの循環のみ考慮
			groupId++;
			for (const nodeId of cycle) {
				const node = nodes.find(n => n.id === nodeId);
				if (node) {
					// グループ配列に追加
					node.groups.push(groupId);
					// まだプライマリグループが設定されていなければ、このグループをプライマリに
					if (!node.group) {
						node.group = groupId;
					}
				}
			}
		}
	});
};

// 最小の循環を検出する関数
const findMinimalCycles = (graph: Map<string, string[]>): Set<string>[] => {
	const cycles: Set<string>[] = [];
	const visited = new Set<string>();

	// 各ノードから探索開始
	for (const [startNode] of graph.entries()) {
		if (visited.has(startNode)) continue;

		// 深さ3までの循環を検出
		findCyclesOfLength(startNode, startNode, new Set<string>(), 0, 3, graph, cycles, visited, new Map());
	}

	return cycles;
};

// 特定の長さの循環を検出する
const findCyclesOfLength = (
	startNode: string,
	currentNode: string,
	path: Set<string>,
	depth: number,
	maxDepth: number,
	graph: Map<string, string[]>,
	cycles: Set<string>[],
	globalVisited: Set<string>,
	nodePathMap: Map<string, string[]>
): void => {
	// 現在のパスにノードを追加
	path.add(currentNode);

	// 現在のパスを配列として記録
	const currentPath = Array.from(path);
	nodePathMap.set(currentNode, currentPath);

	// 最大深さに達したら探索を終了
	if (depth >= maxDepth) {
		path.delete(currentNode);
		return;
	}

	const neighbors = graph.get(currentNode) || [];

	for (const neighbor of neighbors) {
		// 直前に訪れたノードはスキップ（往復を防ぐ）
		if (depth > 0 && neighbor === currentPath[currentPath.length - 2]) {
			continue;
		}

		// 開始ノードに戻る場合（循環検出）
		if (neighbor === startNode && depth >= 2) {
			// 新しい循環を記録
			const newCycle = new Set(currentPath);

			// 既存の循環と比較して、包含関係にないか確認
			let isMinimal = true;
			for (const existingCycle of cycles) {
				// 新しい循環が既存の循環を完全に含む場合
				if (isSubset(existingCycle, newCycle)) {
					isMinimal = false;
					break;
				}

				// 既存の循環が新しい循環を完全に含む場合、既存の循環を削除
				if (isSubset(newCycle, existingCycle)) {
					cycles.splice(cycles.indexOf(existingCycle), 1);
				}
			}

			if (isMinimal) {
				cycles.push(newCycle);
			}
			continue;
		}

		// すでにパスに含まれるノードはスキップ（ループを防ぐ）
		if (path.has(neighbor)) {
			continue;
		}

		// 次のノードへ探索
		findCyclesOfLength(startNode, neighbor, path, depth + 1, maxDepth, graph, cycles, globalVisited, nodePathMap);
	}

	// バックトラック
	path.delete(currentNode);
};

// あるセットが別のセットのサブセットかどうかをチェック
const isSubset = (subset: Set<string>, superset: Set<string>): boolean => {
	if (subset.size > superset.size) return false;

	for (const item of subset) {
		if (!superset.has(item)) return false;
	}

	return true;
};

// 残りの未割り当てのノードにリンクごとにグループを割り当て
const assignGroupsToRemainingNodes = (nodes: FriendNode[], links: FriendLink[]): void => {
	let groupId = nodes.reduce((max, node) => {
		// groupsが空の場合はデフォルト値0を使用
		const maxGroupInNode = node.groups.length > 0 ? Math.max(...node.groups) : 0;
		return Math.max(max, maxGroupInNode);
	}, 0);

	// リンクごとに新しいグループを割り当て
	for (const link of links) {
		const sourceId = link.source.toString();
		const targetId = link.target.toString();

		const sourceNode = nodes.find(node => node.id === sourceId);
		const targetNode = nodes.find(node => node.id === targetId);

		if (sourceNode && targetNode) {
			// 新しいグループIDを割り当て
			groupId++;

			// 両方のノードのグループ配列に追加
			sourceNode.groups.push(groupId);
			targetNode.groups.push(groupId);

			// まだプライマリグループが設定されていなければ、このグループをプライマリに
			if (!sourceNode.group) {
				sourceNode.group = groupId;
			}

			if (!targetNode.group) {
				targetNode.group = groupId;
			}
		}
	}

	// それでも割り当てのないノードは個別のグループに
	nodes.forEach(node => {
		if (node.groups.length === 0) {
			groupId++;
			node.groups.push(groupId);
			node.group = groupId;
		}
	});

	// グループの包含関係をチェックし、包含されているグループを削除
	removeSubsetGroups(nodes);
};

// グループの包含関係をチェックし、サブセットとなるグループを削除する
const removeSubsetGroups = (nodes: FriendNode[]): void => {
	// 各グループに属するノードのIDセットを作成
	const groupNodeSets = new Map<number, Set<string>>();

	// ノードからグループ情報を収集
	nodes.forEach(node => {
		node.groups.forEach(groupId => {
			if (!groupNodeSets.has(groupId)) {
				groupNodeSets.set(groupId, new Set<string>());
			}
			groupNodeSets.get(groupId)?.add(node.id);
		});
	});

	// 削除すべきグループIDを収集
	const groupsToRemove = new Set<number>();

	// 各グループペアについて包含関係をチェック
	const groupIds = Array.from(groupNodeSets.keys());
	for (let i = 0; i < groupIds.length; i++) {
		const groupIdA = groupIds[i];
		const nodesInGroupA = groupNodeSets.get(groupIdA)!;

		// 既に削除対象のグループはスキップ
		if (groupsToRemove.has(groupIdA)) continue;

		for (let j = 0; j < groupIds.length; j++) {
			if (i === j) continue;

			const groupIdB = groupIds[j];
			const nodesInGroupB = groupNodeSets.get(groupIdB)!;

			// 既に削除対象のグループはスキップ
			if (groupsToRemove.has(groupIdB)) continue;

			// グループAがグループBのサブセットかチェック
			if (isNodeSetSubset(nodesInGroupA, nodesInGroupB)) {
				// 小さい方のグループ（A）を削除対象に追加
				groupsToRemove.add(groupIdA);
				break;
			}
		}
	}

	// 削除対象のグループをノードから削除
	if (groupsToRemove.size > 0) {
		nodes.forEach(node => {
			// 各ノードのgroupsからgroupsToRemoveに含まれるグループIDを削除
			node.groups = node.groups.filter(groupId => !groupsToRemove.has(groupId));

			// プライマリグループが削除された場合は新しいプライマリグループを設定
			if (node.group && groupsToRemove.has(node.group)) {
				node.group = node.groups.length > 0 ? node.groups[0] : undefined;
			}
		});
	}
};

// ノードIDのセットがサブセットかチェック
const isNodeSetSubset = (subset: Set<string>, superset: Set<string>): boolean => {
	// サブセットの方が大きい場合は明らかにサブセットではない
	if (subset.size > superset.size) return false;

	// サブセットの全ての要素がスーパーセットに含まれるかチェック
	for (const nodeId of subset) {
		if (!superset.has(nodeId)) return false;
	}

	return true;
};