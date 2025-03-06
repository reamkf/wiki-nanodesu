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

// グラフ構造からグループを検出する関数群
// -----------------------------------------------------------------

/**
 * BFSアルゴリズムでグループを検出する関数
 * @param nodes フレンズノードの配列
 * @param links フレンズ間のリンク配列
 */
const detectGroups = (nodes: FriendNode[], links: FriendLink[]): void => {
	// 隣接リスト形式のグラフ構造を作成
	const graph = createAdjacencyGraph(nodes, links);

	// 1. 循環（サイクル）パターンを検出
	detectCycles(nodes, graph);

	// 2. 完全グラフパターンを検出（すべてのノードが相互に接続）
	detectCompleteGraphs(nodes, graph);

	// 3. 星形グラフパターンを検出（中心ノード1つが他の全ノードと接続）
	detectStarGraphs(nodes, graph);

	// 4. 残りの未割り当てのノードに対して、リンクごとに異なるグループを割り当て
	assignGroupsToRemainingNodes(nodes, links);
};

/**
 * ノードとリンクから隣接リスト形式のグラフを作成
 * @param nodes フレンズノードの配列
 * @param links フレンズ間のリンク配列
 * @returns ノードIDをキー、隣接ノードの配列を値とするMap
 */
const createAdjacencyGraph = (nodes: FriendNode[], links: FriendLink[]): Map<string, string[]> => {
	const graph = new Map<string, string[]>();

	// 各ノードをグラフに追加（空の隣接リストで初期化）
	nodes.forEach(node => {
		graph.set(node.id, []);
	});

	// リンクをグラフに追加（双方向）
	links.forEach(link => {
		const sourceId = link.source.toString();
		const targetId = link.target.toString();

		// 元ノードの隣接リストに対象ノードを追加
		const sourceNeighbors = graph.get(sourceId) || [];
		sourceNeighbors.push(targetId);
		graph.set(sourceId, sourceNeighbors);

		// 対象ノードの隣接リストに元ノードを追加
		const targetNeighbors = graph.get(targetId) || [];
		targetNeighbors.push(sourceId);
		graph.set(targetId, targetNeighbors);
	});

	return graph;
};

// 循環（サイクル）検出関連の関数群
// -----------------------------------------------------------------

/**
 * 循環（サイクル）を検出するアルゴリズム
 * @param nodes フレンズノードの配列
 * @param graph 隣接リスト形式のグラフ
 */
const detectCycles = (nodes: FriendNode[], graph: Map<string, string[]>): void => {
	let groupId = 0;

	// 最小の循環（三角形など）を見つける
	const cycles = findMinimalCycles(graph);

	// 検出された循環ごとに新しいグループを作成
	cycles.forEach(cycle => {
		// 3〜7ノードの循環のみ考慮（大きすぎるグループは除外）
		if (cycle.size >= 3 && cycle.size <= 7) {
			groupId++;
			assignGroupToNodes(nodes, cycle, groupId);
		}
	});
};

/**
 * 最小の循環を検出する関数
 * @param graph 隣接リスト形式のグラフ
 * @returns 循環を構成するノードIDのセットの配列
 */
const findMinimalCycles = (graph: Map<string, string[]>): Set<string>[] => {
	const cycles: Set<string>[] = [];
	const visited = new Set<string>();

	// 各ノードから探索開始
	for (const [startNode] of graph.entries()) {
		if (visited.has(startNode)) continue;

		// 深さ7までの循環を検出
		const nodePathMap = new Map<string, string[]>();
		findCyclesOfLength(startNode, startNode, new Set<string>(), 0, 7, graph, cycles, visited, nodePathMap);
	}

	return cycles;
};

/**
 * 特定の長さの循環を検出する再帰関数
 * @param startNode 探索開始ノードID
 * @param currentNode 現在のノードID
 * @param path 現在の探索パス
 * @param depth 現在の探索深さ
 * @param maxDepth 最大探索深さ
 * @param graph 隣接リスト形式のグラフ
 * @param cycles 検出された循環の配列
 * @param globalVisited 全体で訪問済みのノードセット
 * @param nodePathMap ノードIDから探索パスへのマップ
 */
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
			processCycleDetection(currentPath, cycles);
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

/**
 * 循環が検出された時の処理
 * @param currentPath 現在の探索パス（循環を形成）
 * @param cycles 検出された循環の配列
 */
const processCycleDetection = (currentPath: string[], cycles: Set<string>[]): void => {
	// 新しい循環を記録
	const newCycle = new Set(currentPath);

	// 既存の循環と比較して、包含関係にないか確認
	let isMinimal = true;

	// 既存の循環をコピーして反復処理（反復中に配列が変更される可能性があるため）
	const cyclesCopy = [...cycles];

	for (const existingCycle of cyclesCopy) {
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
};

// 完全グラフ検出関連の関数群
// -----------------------------------------------------------------

/**
 * 完全グラフ（すべてのノードが相互に接続）を検出する関数
 * @param nodes フレンズノードの配列
 * @param graph 隣接リスト形式のグラフ
 */
const detectCompleteGraphs = (nodes: FriendNode[], graph: Map<string, string[]>): void => {
	let groupId = 10000; // 循環グループとIDが被らないように大きな値から開始

	// 隣接ノード数が多いノードから処理するためにソート
	const sortedNodeIds = getSortedNodeIdsByNeighborCount(nodes, graph, 100);

	// 大きいサイズから処理（より大きなグループを優先的に検出）
	for (let size = 7; size >= 4; size--) {
		// 6ノードサイズのグループには特に高い制限値を設定（検出率向上）
		const maxCombLimit = size === 6 ? 5000 : 2000;

		console.log(`完全グラフ検出: ${size}ノードサイズの検出を開始`);

		// サイズに合わせたノードの組み合わせを生成（制限あり）
		const combinations = generateCombinations(sortedNodeIds, size, maxCombLimit);
		console.log(`生成された組み合わせ数: ${combinations.length}`);

		// 組み合わせごとに完全グラフかどうかをチェック
		let detectedCount = 0;
		combinations.forEach(combination => {
			// 完全グラフかどうかを確認
			if (isCompleteGraph(combination, graph)) {
				groupId++;
				detectedCount++;

				// この組み合わせのノードすべてに新しいグループIDを割り当て
				assignGroupToNodes(nodes, new Set(combination), groupId);
			}
		});

		console.log(`検出された${size}ノードの完全グラフ数: ${detectedCount}`);
	}
};

/**
 * 隣接ノード数が多い順にノードIDをソートして返す
 * @param nodes フレンズノードの配列
 * @param graph 隣接リスト形式のグラフ
 * @param limit 返すノード数の上限
 * @returns ソートされたノードIDの配列
 */
const getSortedNodeIdsByNeighborCount = (
	nodes: FriendNode[],
	graph: Map<string, string[]>,
	limit: number
): string[] => {
	// ノードIDと隣接ノード数のペアを作成
	const nodeIdsWithNeighborCount = nodes.map(node => ({
		id: node.id,
		neighborCount: (graph.get(node.id) || []).length
	}));

	// 隣接ノード数の多い順にソート
	nodeIdsWithNeighborCount.sort((a, b) => b.neighborCount - a.neighborCount);

	// 指定された上限数まで返す
	return nodeIdsWithNeighborCount.slice(0, limit).map(n => n.id);
};

/**
 * 与えられたノードの組み合わせが完全グラフかどうかを確認
 * @param nodeIds ノードIDの配列
 * @param graph 隣接リスト形式のグラフ
 * @returns 完全グラフであればtrue
 */
const isCompleteGraph = (nodeIds: string[], graph: Map<string, string[]>): boolean => {
	// 必要なエッジ数：n*(n-1)/2（完全グラフの場合）
	const requiredEdgeCount = nodeIds.length * (nodeIds.length - 1) / 2;
	let actualEdgeCount = 0;

	// 各ノードの隣接リストをキャッシュ（繰り返しのgraph.getを避ける）
	const neighborsCache = new Map<string, Set<string>>();
	nodeIds.forEach(id => {
		neighborsCache.set(id, new Set(graph.get(id) || []));
	});

	// 完全グラフでは、各ノードは他のすべてのノードと接続している必要がある
	for (let i = 0; i < nodeIds.length; i++) {
		const neighbors = neighborsCache.get(nodeIds[i])!;

		// 現在のノードが他のすべてのノードと接続しているか確認
		for (let j = i + 1; j < nodeIds.length; j++) {
			if (neighbors.has(nodeIds[j])) {
				actualEdgeCount++;
			} else {
				return false; // 接続がない場合は完全グラフではない（早期リターン）
			}
		}
	}

	// 完全グラフの条件：すべてのノード間に接続がある
	return actualEdgeCount === requiredEdgeCount;
};

// 星形グラフ検出関連の関数群
// -----------------------------------------------------------------

/**
 * 星形グラフ（中心ノード1つが他の全ノードと接続）を検出する関数
 * @param nodes フレンズノードの配列
 * @param graph 隣接リスト形式のグラフ
 */
const detectStarGraphs = (nodes: FriendNode[], graph: Map<string, string[]>): void => {
	let groupId = 20000; // 他のグループとIDが被らないように大きな値から開始

	// 隣接ノード数が多いノードから処理（星形の中心ノードになりやすい）
	const sortedNodes = [...nodes].sort((a, b) =>
		(graph.get(b.id) || []).length - (graph.get(a.id) || []).length
	);

	// 処理対象のノードを制限（上位50ノードのみ）
	const limitedNodes = sortedNodes.slice(0, 50);

	// 各ノードについて、星形の中心になり得るか確認
	limitedNodes.forEach(centerNode => {
		const neighbors = graph.get(centerNode.id) || [];

		// 周辺ノードが4つ以上ある場合のみ処理（5ノード以上の星形）
		if (neighbors.length >= 4) {
			// 星形検出の効率化のため、ノード数を制限（最大15ノード）
			const limitedNeighbors = neighbors.slice(0, 15);

			// 星形グラフの条件を満たすか確認
			if (checkStarShape(centerNode.id, limitedNeighbors, graph)) {
				groupId++;

				// 中心ノードとすべての周辺ノードに同じグループIDを割り当て
				const starNodes = new Set<string>([centerNode.id, ...limitedNeighbors]);
				assignGroupToNodes(nodes, starNodes, groupId);
			}
		}
	});
};

/**
 * 星形グラフかどうかを確認
 * @param centerId 中心ノードID
 * @param peripheryIds 周辺ノードIDの配列
 * @param graph 隣接リスト形式のグラフ
 * @returns 星形グラフの条件を満たせばtrue
 */
const checkStarShape = (centerId: string, peripheryIds: string[], graph: Map<string, string[]>): boolean => {
	// 周辺ノード同士が直接接続していないことを確認
	for (let i = 0; i < peripheryIds.length; i++) {
		const neighbors = graph.get(peripheryIds[i]) || [];

		// 周辺ノードの隣接ノードには中心ノード以外の周辺ノードが含まれていないことを確認
		for (let j = 0; j < peripheryIds.length; j++) {
			if (i !== j && neighbors.includes(peripheryIds[j])) {
				return false; // 周辺ノード同士が接続している場合は星形ではない
			}
		}

		// 周辺ノードが中心ノードと接続していることを確認
		if (!neighbors.includes(centerId)) {
			return false; // 中心ノードと接続していない場合は星形ではない
		}
	}
	return true; // すべての条件を満たす場合は星形
};

// グループ割り当て関連の関数群
// -----------------------------------------------------------------

/**
 * 特定のノードセットにグループIDを割り当てる
 * @param nodes フレンズノードの配列
 * @param nodeIds グループに属するノードIDのセット
 * @param groupId 割り当てるグループID
 */
const assignGroupToNodes = (nodes: FriendNode[], nodeIds: Set<string>, groupId: number): void => {
	for (const nodeId of nodeIds) {
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
};

/**
 * 残りの未割り当てのノードにリンクごとにグループを割り当て
 * @param nodes フレンズノードの配列
 * @param links フレンズ間のリンク配列
 */
const assignGroupsToRemainingNodes = (nodes: FriendNode[], links: FriendLink[]): void => {
	// 現在の最大グループID値を取得
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

// ユーティリティ関数群
// -----------------------------------------------------------------

/**
 * あるセットが別のセットのサブセットかどうかをチェック
 * @param subset チェックするサブセット
 * @param superset スーパーセット
 * @returns サブセットであればtrue
 */
const isSubset = (subset: Set<string>, superset: Set<string>): boolean => {
	if (subset.size > superset.size) return false;

	for (const item of subset) {
		if (!superset.has(item)) return false;
	}

	return true;
};

/**
 * ノードIDのセットがサブセットかチェック
 * @param subset チェックするサブセット
 * @param superset スーパーセット
 * @returns サブセットであればtrue
 */
const isNodeSetSubset = (subset: Set<string>, superset: Set<string>): boolean => {
	// サブセットの方が大きい場合は明らかにサブセットではない
	if (subset.size > superset.size) return false;

	// サブセットの全ての要素がスーパーセットに含まれるかチェック
	for (const nodeId of subset) {
		if (!superset.has(nodeId)) return false;
	}

	return true;
};

/**
 * グループの包含関係をチェックし、サブセットとなるグループを削除する
 * @param nodes フレンズノードの配列
 */
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

/**
 * 配列からサイズkの組み合わせをすべて生成する関数（最大数制限あり）
 * @param array 元の配列
 * @param k 選ぶ要素数
 * @param maxCombinations 生成する最大組み合わせ数
 * @returns 生成された組み合わせの配列
 */
const generateCombinations = <T>(array: T[], k: number, maxCombinations: number = 10000): T[][] => {
	const result: T[][] = [];

	// 大きなサイズの組み合わせは非効率的なので、追加の最適化
	if (k > 5 && array.length > 30) {
		// 効率化のため、上位のノードのみを使用
		const targetArray = array.slice(0, Math.min(array.length, 30));
		generateOptimizedCombinations(targetArray, k, result, maxCombinations);
	} else {
		// 標準的な組み合わせ生成（小さいサイズの場合）
		generateStandardCombinations(array, k, result, maxCombinations);
	}

	return result;
};

/**
 * 最適化された組み合わせ生成（大きなサイズ用）
 * @param array 元の配列
 * @param k 選ぶ要素数
 * @param result 結果を格納する配列
 * @param maxCombinations 生成する最大組み合わせ数
 */
const generateOptimizedCombinations = <T>(
	array: T[],
	k: number,
	result: T[][],
	maxCombinations: number
): void => {
	const combine = (start: number, current: T[]) => {
		// 最大組み合わせ数に達したら終了
		if (result.length >= maxCombinations) {
			return;
		}

		if (current.length === k) {
			result.push([...current]);
			return;
		}

		// 残り必要なノード数
		const remaining = k - current.length;
		// 残りの選択肢の数
		const available = array.length - start;

		// 残りの選択肢から必要なノード数を選べない場合は打ち切り（枝刈り）
		if (remaining > available) {
			return;
		}

		for (let i = start; i < array.length; i++) {
			current.push(array[i]);
			combine(i + 1, current);
			current.pop();
		}
	};

	combine(0, []);
};

/**
 * 標準的な組み合わせ生成（小さいサイズ用）
 * @param array 元の配列
 * @param k 選ぶ要素数
 * @param result 結果を格納する配列
 * @param maxCombinations 生成する最大組み合わせ数
 */
const generateStandardCombinations = <T>(
	array: T[],
	k: number,
	result: T[][],
	maxCombinations: number
): void => {
	const combine = (start: number, current: T[]) => {
		// 最大組み合わせ数に達したら終了
		if (result.length >= maxCombinations) {
			return;
		}

		if (current.length === k) {
			result.push([...current]);
			return;
		}

		for (let i = start; i < array.length; i++) {
			current.push(array[i]);
			combine(i + 1, current);
			current.pop();
		}
	};

	combine(0, []);
};