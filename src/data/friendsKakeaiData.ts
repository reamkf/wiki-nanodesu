import { FriendNode, FriendLink, GraphData } from '@/types/friends-kakeai-graph';
import { getFriendsData } from '@/data/friendsData';
import { getWikiNanodaPageUrl } from '@/utils/seesaaWiki';
import { readCsv } from '../utils/readCsv';

// --- 定数定義 ---
const CYCLE_DETECTION_MIN_SIZE = 3;
const CYCLE_DETECTION_MAX_SIZE = 7;
const CYCLE_DETECTION_MAX_DEPTH = 7;

const COMPLETE_GRAPH_GROUP_ID_START = 10000;
const COMPLETE_GRAPH_MIN_SIZE_FOR_DETECTION = 4; // 完全グラフとして検出する最小サイズ
const COMPLETE_GRAPH_MAX_SIZE_FOR_COMBINATION_METHOD = 7; // 組み合わせ法で探索する最大サイズ
const COMBINATION_METHOD_SIZE_6_MAX_COMBINATIONS = 5000;
const COMBINATION_METHOD_DEFAULT_MAX_COMBINATIONS = 2000;

// mergeHighlyConnectedGroups の閾値
const MERGE_GROUP_MIN_NODE_SIZE_THRESHOLD = 2; // これ以下のサイズのグループはマージ処理で無視
const MERGE_GROUP_COMMON_RATIO_THRESHOLD = 0.5; // 共通ノード割合の閾値
const MERGE_GROUP_MIN_COMMON_NODES_FOR_RATIO_MERGE = 2; // 上記割合でマージする場合の最小共通ノード数
const MERGE_GROUP_DENSE_CONNECTION_THRESHOLD = 0.75; // 高密接続と判断する閾値

const SORTED_NODE_IDS_DEFAULT_LIMIT = 100; // getSortedNodeIdsByNeighborCountで取得するデフォルトのノード数上限

// detectCompleteGraphs 内の欲張り法 (findMaximalCompleteGraph) 関連の閾値
const COMPLETE_GRAPH_TOP_NODES_FOR_MAXIMAL_SEARCH = 30; // 欲張り法で起点とする隣接ノード数上位のノード数
const COMPLETE_GRAPH_MAXIMAL_SEARCH_NEIGHBOR_LIMIT = 20; // 欲張り法で考慮する隣接ノード数の上限
const COMPLETE_GRAPH_MAXIMAL_SEARCH_NEIGHBOR_FILTER_INDEX = 50; // 欲張り法で隣接ノードをフィルタリングする際のインデックス上限

// --- 定数定義ここまで ---

export const getFriendsKakeaiData = async (): Promise<GraphData> => {
	try {
		const kakeaiData = await readCsv<Record<string, string>, Record<string, string>>(
			'フレンズ掛け合い一覧.csv',
			{},
			async (data) => data
		);
		const friendsData = await getFriendsData();

		// 掛け合い先のノード数
		const kakeaiTargetNum = Object.keys(kakeaiData[0] || {}).filter(key => key.startsWith('掛け合い先')).length;

		// 1. 全ての関連フレンズIDを収集
		const allFriendIds = new Set<string>();
		kakeaiData.forEach(kakeai => {
			const sourceId = kakeai['掛け合い元'];
			if (sourceId) allFriendIds.add(sourceId);
			for (let i = 1; i <= kakeaiTargetNum; i++) {
				const targetId = kakeai[`掛け合い先${i}`];
				if (targetId) allFriendIds.add(targetId);
			}
		});

		// 2. IDセットからNode Mapを一括作成
		const nodes = new Map<string, FriendNode>();
		allFriendIds.forEach(id => {
			const friend = friendsData.find(f => f.id === id);
			nodes.set(id, {
				id: id,
				name: friend?.name || id,
				iconUrl: friend?.iconUrl || '',
				linkUrl: getWikiNanodaPageUrl(id),
				groups: [], // 空のグループ配列で初期化
			});
		});

		// 3. kakeaiDataを再度ループしてLinkを作成
		const links: FriendLink[] = [];
		kakeaiData.forEach(kakeai => {
			const sourceId = kakeai['掛け合い元'];
			// sourceIdがnodesに存在することを確認（allFriendIdsから作成しているので基本的には存在するはず）
			if (!sourceId || !nodes.has(sourceId)) return;

			for (let i = 1; i <= kakeaiTargetNum; i++) {
				const targetId = kakeai[`掛け合い先${i}`];
				// targetIdが存在し、かつnodesに存在することを確認
				if (!targetId || !nodes.has(targetId)) continue;

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
		detectKakeaiGroups(nodesArray, links);

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
const detectKakeaiGroups = (nodes: FriendNode[], links: FriendLink[]): void => {
	// 隣接リスト形式のグラフ構造を作成
	const graph = createAdjacencyGraph(nodes, links);

	// 1. 完全グラフパターンを検出（すべてのノードが相互に接続）
	detectCompleteGraphs(nodes, graph);

	// 2. 循環（サイクル）パターンを検出
	detectCycles(nodes, graph);

	// 3. 星形グラフパターンを検出（中心ノード1つが他の全ノードと接続）
	// detectStarGraphs(nodes, graph);

	// 4. 残りの未割り当てのノードに対して、リンクごとに異なるグループを割り当て
	assignGroupsToRemainingNodes(nodes, links);

	// 5. 密に接続されたグループの統合
	mergeHighlyConnectedGroups(nodes, graph);
};

/**
 * ノードとリンクから隣接リスト形式のグラフを作成
 * @param nodes フレンズノードの配列
 * @param links フレンズ間のリンク配列
 * @returns ノードIDをキー、隣接ノードの配列を値とするMap
 */
const createAdjacencyGraph = (nodes: FriendNode[], links: FriendLink[]): Map<string, Set<string>> => {
	const graph = new Map<string, Set<string>>();
	nodes.forEach(node => graph.set(node.id, new Set<string>()));
	links.forEach(link => {
		const sourceId = link.source.toString();
		const targetId = link.target.toString();
		graph.get(sourceId)!.add(targetId);
		graph.get(targetId)!.add(sourceId);
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
const detectCycles = (nodes: FriendNode[], graph: Map<string, Set<string>>): void => {
	let groupId = 0;

	// 最小の循環（三角形など）を見つける
	const cycles = findMinimalCycles(graph);

	// 検出された循環ごとに新しいグループを作成
	cycles.forEach(cycle => {
		// 3〜7ノードの循環のみ考慮（大きすぎるグループは除外）
		if (cycle.size >= CYCLE_DETECTION_MIN_SIZE && cycle.size <= CYCLE_DETECTION_MAX_SIZE) {
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
const findMinimalCycles = (graph: Map<string, Set<string>>): Set<string>[] => {
	const cycles: Set<string>[] = [];
	const globalVisited = new Set<string>(); // TODO: globalVisited の更新処理 (現状は未実装のため効果なし)

	// 各ノードから探索開始
	for (const [startNode] of graph.entries()) {
		// if (globalVisited.has(startNode)) continue; // globalVisited が未更新のため無効

		// 深さ7までの循環を検出
		findCyclesOfLength(startNode, startNode, [], new Set<string>(), 0, CYCLE_DETECTION_MAX_DEPTH, graph, cycles, globalVisited);
	}

	return cycles;
};

/**
 * 特定の長さの循環を検出する再帰関数
 * @param startNode 探索開始ノードID
 * @param currentNode 現在のノードID
 * @param currentPath 現在の探索パス（配列）
 * @param visitedInPath 現在のパスに含まれるノードのセット
 * @param depth 現在の探索深さ
 * @param maxDepth 最大探索深さ
 * @param graph 隣接リスト形式のグラフ
 * @param cycles 検出された循環の配列
 * @param globalVisited 全体で訪問済みのノードセット（現状、この関数内では参照・更新されていない）
 */
const findCyclesOfLength = (
	startNode: string,
	currentNode: string,
	currentPath: string[],
	visitedInPath: Set<string>,
	depth: number,
	maxDepth: number,
	graph: Map<string, Set<string>>,
	cycles: Set<string>[],
	globalVisited: Set<string>
): void => {
	// 現在のパスにノードを追加
	currentPath.push(currentNode);
	visitedInPath.add(currentNode);

	// 最大深さに達したら探索を終了
	if (depth >= maxDepth) {
		currentPath.pop();
		visitedInPath.delete(currentNode);
		return;
	}

	const neighbors = graph.get(currentNode) || new Set<string>();

	for (const neighbor of neighbors) {
		// 直前のノードへの逆戻りを防止
		if (currentPath.length >= 2 && neighbor === currentPath[currentPath.length - 2]) {
			continue;
		}

		// 循環を検出 (開始ノードに戻り、パス長3以上)
		if (neighbor === startNode && depth >= 2) {
			processCycleDetection(currentPath, cycles);
			continue;
		}

		// 同一パス内でのノード重複を防止 (単純サイクル追求)
		if (visitedInPath.has(neighbor)) {
			continue;
		}

		findCyclesOfLength(startNode, neighbor, currentPath, visitedInPath, depth + 1, maxDepth, graph, cycles, globalVisited);
	}

	// バックトラック
	currentPath.pop();
	visitedInPath.delete(currentNode);
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
const detectCompleteGraphs = (nodes: FriendNode[], graph: Map<string, Set<string>>): void => {
	let groupId = COMPLETE_GRAPH_GROUP_ID_START;
	const sortedNodeIds = getSortedNodeIdsByNeighborCount(nodes, graph, SORTED_NODE_IDS_DEFAULT_LIMIT);
	const detectedCompleteGraphs: Set<string>[] = [];
	const topNodes = sortedNodeIds.slice(0, COMPLETE_GRAPH_TOP_NODES_FOR_MAXIMAL_SEARCH);
	for (const startNodeId of topNodes) {
		let alreadyInLargeGraph = false;
		for (const existingGraph of detectedCompleteGraphs) {
			if (existingGraph.size >= COMPLETE_GRAPH_MIN_SIZE_FOR_DETECTION + 1 && existingGraph.has(startNodeId)) {
				alreadyInLargeGraph = true;
				break;
			}
		}
		if (alreadyInLargeGraph) continue;

		const neighborSet = graph.get(startNodeId) || new Set<string>();
		let neighborsArr = Array.from(neighborSet);
		if (neighborsArr.length > COMPLETE_GRAPH_MAXIMAL_SEARCH_NEIGHBOR_LIMIT) {
			neighborsArr = neighborsArr
				.filter(n => sortedNodeIds.indexOf(n) < COMPLETE_GRAPH_MAXIMAL_SEARCH_NEIGHBOR_FILTER_INDEX)
				.slice(0, COMPLETE_GRAPH_MAXIMAL_SEARCH_NEIGHBOR_LIMIT);
		}

		if (neighborsArr.length >= COMPLETE_GRAPH_MIN_SIZE_FOR_DETECTION - 1) {
			const potentialGraphNodes = new Set<string>([startNodeId, ...neighborsArr]);
			const maxCompleteGraph = findMaximalCompleteGraph(Array.from(potentialGraphNodes), graph);
			if (maxCompleteGraph.size >= COMPLETE_GRAPH_MIN_SIZE_FOR_DETECTION) {
				detectedCompleteGraphs.push(maxCompleteGraph);
			}
		}
	}

	const sortedGraphs = detectedCompleteGraphs.sort((a, b) => b.size - a.size);
	for (const completeGraph of sortedGraphs) {
		if (completeGraph.size >= COMPLETE_GRAPH_MIN_SIZE_FOR_DETECTION) {
			groupId++;
			assignGroupToNodes(nodes, completeGraph, groupId);
		}
	}

	for (let size = COMPLETE_GRAPH_MAX_SIZE_FOR_COMBINATION_METHOD; size >= COMPLETE_GRAPH_MIN_SIZE_FOR_DETECTION; size--) {
		const maxCombLimit = size === 6 ? COMBINATION_METHOD_SIZE_6_MAX_COMBINATIONS : COMBINATION_METHOD_DEFAULT_MAX_COMBINATIONS;
		const combinations = generateCombinations(sortedNodeIds, size, maxCombLimit);
		combinations.forEach(combination => {
			const currentCombinationSet = new Set(combination);
			let isSubsetOfExistingLargeGraph = false;
			for (const existingLargeGraph of sortedGraphs) {
				if (isSubset(currentCombinationSet, existingLargeGraph)) {
					isSubsetOfExistingLargeGraph = true;
					break;
				}
			}
			if (isSubsetOfExistingLargeGraph) return;
			if (isCompleteGraph(combination, graph)) {
				groupId++;
				assignGroupToNodes(nodes, currentCombinationSet, groupId);
			}
		});
	}
};

/**
 * 最大の完全グラフを見つける関数（欲張り法）
 * @param nodeIds 候補ノードIDの配列
 * @param graph 隣接リスト形式のグラフ
 * @returns 最大の完全グラフを構成するノードIDのセット
 */
const findMaximalCompleteGraph = (nodeIds: string[], graph: Map<string, Set<string>>): Set<string> => {
	// 結果として返す完全グラフのノードセット
	const result = new Set<string>();

	// 各ノードの隣接ノードをキャッシュ
	const neighborsCache = new Map<string, Set<string>>();
	nodeIds.forEach(id => {
		const neighbors = graph.get(id) || new Set<string>();
		neighborsCache.set(id, new Set(neighbors));
	});

	// ノードをソート（隣接ノード数が多い順）
	const sortedNodes = [...nodeIds].sort((a, b) =>
		(neighborsCache.get(b)?.size || 0) - (neighborsCache.get(a)?.size || 0)
	);

	// 最初のノードを追加
	if (sortedNodes.length > 0) {
		result.add(sortedNodes[0]);
	}

	// 残りのノードを順番に試す
	for (let i = 1; i < sortedNodes.length; i++) {
		const candidate = sortedNodes[i];
		let canAdd = true;

		// 候補ノードが現在の結果セットの各ノードと接続しているか確認
		for (const node of result) {
			if (!neighborsCache.get(node)?.has(candidate)) {
				canAdd = false;
				break;
			}
		}

		// すべてのノードと接続している場合は追加
		if (canAdd) {
			result.add(candidate);
		}
	}

	return result;
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
	graph: Map<string, Set<string>>,
	limit: number
): string[] => {
	const nodeIdsWithNeighborCount = nodes.map(node => ({
		id: node.id,
		neighborCount: graph.get(node.id)?.size || 0
	}));
	nodeIdsWithNeighborCount.sort((a, b) => b.neighborCount - a.neighborCount);
	return nodeIdsWithNeighborCount.slice(0, limit).map(n => n.id);
};

/**
 * 与えられたノードの組み合わせが完全グラフかどうかを確認
 * @param nodeIds ノードIDの配列
 * @param graph 隣接リスト形式のグラフ
 * @returns 完全グラフであればtrue
 */
const isCompleteGraph = (nodeIds: string[], graph: Map<string, Set<string>>): boolean => {
	const requiredEdgeCount = nodeIds.length * (nodeIds.length - 1) / 2;
	let actualEdgeCount = 0;
	const neighborsCache = new Map<string, Set<string>>();
	nodeIds.forEach(id => {
		const neighbors = graph.get(id) || new Set<string>();
		neighborsCache.set(id, new Set(neighbors));
	});
	for (let i = 0; i < nodeIds.length; i++) {
		const neighbors = neighborsCache.get(nodeIds[i])!;
		for (let j = i + 1; j < nodeIds.length; j++) {
			if (neighbors.has(nodeIds[j])) {
				actualEdgeCount++;
			} else {
				return false;
			}
		}
	}
	return actualEdgeCount === requiredEdgeCount;
};

// 星形グラフ検出関連の関数群
// -----------------------------------------------------------------

/**
 * 星形グラフ（中心ノード1つが他の全ノードと接続）を検出する関数
 * @param nodes フレンズノードの配列
 * @param graph 隣接リスト形式のグラフ
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const detectStarGraphs = (nodes: FriendNode[], graph: Map<string, Set<string>>): void => {
	let groupId = 20000; // 他のグループとIDが被らないように大きな値から開始

	// 隣接ノード数が多いノードから処理（星形の中心ノードになりやすい）
	const sortedNodes = [...nodes].sort((a, b) =>
		(graph.get(b.id)?.size || 0) - (graph.get(a.id)?.size || 0)
	);

	// 処理対象のノードを制限（上位50ノードのみ）
	const limitedNodes = sortedNodes.slice(0, 50);

	// 各ノードについて、星形の中心になり得るか確認
	limitedNodes.forEach(centerNode => {
		const neighbors = graph.get(centerNode.id) || new Set<string>();

		// 周辺ノードが4つ以上ある場合のみ処理（5ノード以上の星形）
		if (neighbors.size >= 4) {
			// 星形検出の効率化のため、ノード数を制限（最大15ノード）
			const limitedNeighbors = Array.from(neighbors).slice(0, 15);

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
const checkStarShape = (centerId: string, peripheryIds: string[], graph: Map<string, Set<string>>): boolean => {
	// 周辺ノード同士が直接接続していないことを確認
	for (let i = 0; i < peripheryIds.length; i++) {
		const neighbors = graph.get(peripheryIds[i]) || new Set<string>();

		// 周辺ノードの隣接ノードには中心ノード以外の周辺ノードが含まれていないことを確認
		for (let j = 0; j < peripheryIds.length; j++) {
			if (i !== j && neighbors.has(peripheryIds[j])) {
				return false; // 周辺ノード同士が接続している場合は星形ではない
			}
		}

		// 周辺ノードが中心ノードと接続していることを確認
		if (!neighbors.has(centerId)) {
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
	const nodeMap = new Map(nodes.map(node => [node.id, node]));
	let groupId = nodes.reduce((max, node) => {
		const maxGroupInNode = node.groups.length > 0 ? Math.max(...node.groups) : 0;
		return Math.max(max, maxGroupInNode);
	}, 0);
	for (const link of links) {
		const sourceId = link.source.toString();
		const targetId = link.target.toString();
		const sourceNode = nodeMap.get(sourceId);
		const targetNode = nodeMap.get(targetId);
		if (sourceNode && targetNode) {
			groupId++;
			sourceNode.groups.push(groupId);
			targetNode.groups.push(groupId);
			if (!sourceNode.group) sourceNode.group = groupId;
			if (!targetNode.group) targetNode.group = groupId;
		}
	}
	nodes.forEach(node => {
		if (node.groups.length === 0) {
			groupId++;
			node.groups.push(groupId);
			node.group = groupId;
		}
	});
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
			if (isSubset(nodesInGroupA, nodesInGroupB)) {
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
	let targetArray = array;

	// 最適化: 大量データ時、arrayが関連度順ソート済みと仮定し、処理対象を限定
	if (k > 5 && array.length > 30) {
		targetArray = array.slice(0, Math.min(array.length, 30));
	}

	const combine = (start: number, currentCombination: T[]) => {
		if (result.length >= maxCombinations) {
			return;
		}

		if (currentCombination.length === k) {
			result.push([...currentCombination]);
			return;
		}

		const remaining = k - currentCombination.length;
		const available = targetArray.length - start;

		// 枝刈り: 組み合わせ不可能な場合は探索を打ち切り
		if (remaining > available) {
			return;
		}

		for (let i = start; i < targetArray.length; i++) {
			currentCombination.push(targetArray[i]);
			combine(i + 1, currentCombination);
			currentCombination.pop();
		}
	};

	combine(0, []);
	return result;
};

/**
 * 密に接続されたグループを統合する
 * @param nodes フレンズノードの配列
 * @param graph 隣接リスト形式のグラフ
 */
const mergeHighlyConnectedGroups = (nodes: FriendNode[], graph: Map<string, Set<string>>): void => {
	// 各グループに属するノードのIDセットを作成
	const groupNodeSets = new Map<number, Set<string>>();

	// グループIDが明示的に設定されているノードのみを収集
	nodes.forEach(node => {
		node.groups.forEach(groupId => {
			if (!groupNodeSets.has(groupId)) {
				groupNodeSets.set(groupId, new Set<string>());
			}
			groupNodeSets.get(groupId)?.add(node.id);
		});
	});

	// 統合すべきグループのペアを特定
	const groupsToMerge: [number, number][] = [];
	const groupIds = Array.from(groupNodeSets.keys());

	// 各グループペアについて接続密度をチェック
	for (let i = 0; i < groupIds.length; i++) {
		const groupA = groupIds[i];
		const nodesA = groupNodeSets.get(groupA) || new Set();

		if (nodesA.size <= MERGE_GROUP_MIN_NODE_SIZE_THRESHOLD) continue; // 小さすぎるグループは無視

		for (let j = i + 1; j < groupIds.length; j++) {
			const groupB = groupIds[j];
			const nodesB = groupNodeSets.get(groupB) || new Set();

			if (nodesB.size <= MERGE_GROUP_MIN_NODE_SIZE_THRESHOLD) continue; // 小さすぎるグループは無視

			// 共通ノードの数を計算
			const intersection = new Set<string>();
			for (const nodeId of nodesA) {
				if (nodesB.has(nodeId)) {
					intersection.add(nodeId);
				}
			}

			// 共通要素の割合を計算
			const smallerGroupSize = Math.min(nodesA.size, nodesB.size);
			const commonRatio = smallerGroupSize > 0 ? intersection.size / smallerGroupSize : 0;

			// 共通ノードが多い場合、または高密度に接続されている場合はマージ対象
			if (
				(commonRatio >= MERGE_GROUP_COMMON_RATIO_THRESHOLD && intersection.size >= MERGE_GROUP_MIN_COMMON_NODES_FOR_RATIO_MERGE) || // 50%以上が共通、かつ2ノード以上
				areGroupsDenselyConnected(nodesA, nodesB, graph, MERGE_GROUP_DENSE_CONNECTION_THRESHOLD) // 75%以上の接続密度
			) {
				groupsToMerge.push([groupA, groupB]);
			}
		}
	}

	// グループをマージする
	if (groupsToMerge.length > 0) {
		const groupParent = new Map<number, number>();
		groupIds.forEach(id => groupParent.set(id, id));

		groupsToMerge.forEach(([groupA, groupB]) => {
			const rootA = findGroupRoot(groupA, groupParent);
			const rootB = findGroupRoot(groupB, groupParent);

			if (rootA !== rootB) {
				// 小さい方のIDを親にする（グループIDの一貫性のため）
				if (rootA < rootB) {
					groupParent.set(rootB, rootA);
				} else {
					groupParent.set(rootA, rootB);
				}
			}
		});

		// 各ノードのグループを更新
		nodes.forEach(node => {
			if (node.groups.length > 0) {
				// グループIDをルートIDに置き換え
				const uniqueRootGroups = new Set<number>();
				node.groups.forEach(groupId => {
					const rootGroup = findGroupRoot(groupId, groupParent);
					uniqueRootGroups.add(rootGroup);
				});

				// 更新されたグループのセット
				node.groups = Array.from(uniqueRootGroups);

				// プライマリグループも更新
				if (node.group) {
					node.group = findGroupRoot(node.group, groupParent);
				}
			}
		});
	}
};

/**
 * グループのルート（代表）IDを見つける（Union-Find用）
 * @param groupId 現在のグループID
 * @param parentMap グループIDから親グループIDへのマップ
 * @returns ルートグループID
 */
const findGroupRoot = (groupId: number, parentMap: Map<number, number>): number => {
	let current = groupId;
	while (parentMap.get(current) !== current) {
		current = parentMap.get(current) || current;
	}
	return current;
};

/**
 * 2つのグループが密に接続されているかチェック
 * @param groupA 1つ目のグループのノードIDセット
 * @param groupB 2つ目のグループのノードIDセット
 * @param graph 隣接リスト形式のグラフ
 * @param threshold 接続密度のしきい値（0.0〜1.0）
 * @returns 密に接続されていればtrue
 */
const areGroupsDenselyConnected = (
	groupA: Set<string>,
	groupB: Set<string>,
	graph: Map<string, Set<string>>,
	threshold: number
): boolean => {
	// 異なるグループ間の可能な接続の総数
	const totalPossibleConnections = groupA.size * groupB.size;
	if (totalPossibleConnections === 0) return false;

	// 実際の接続数をカウント
	let actualConnections = 0;

	for (const nodeA of groupA) {
		const neighbors = graph.get(nodeA) || new Set<string>();
		const neighborsSet = new Set(neighbors);

		for (const nodeB of groupB) {
			if (neighborsSet.has(nodeB)) {
				actualConnections++;
			}
		}
	}

	// 接続密度 = 実際の接続数 / 可能な接続の総数
	const density = actualConnections / totalPossibleConnections;

	return density >= threshold;
};