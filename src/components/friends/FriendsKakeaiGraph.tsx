'use client';

import React, { useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';
import { zoom as d3Zoom } from 'd3-zoom';
import { drag as d3Drag } from 'd3-drag';
import { color as d3Color } from 'd3-color';
import type { D3DragEvent } from 'd3-drag';
import { FriendNode, FriendLink, GraphData } from '@/types/friends-kakeai-graph';

// グループ色の配列
const GROUP_COLORS = [
	'#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff',
	'#ffddaa', '#aaffdd', '#ddaaff', '#aaddff', '#ffaadd', '#ddffaa',
	'#bbccff', '#ffccbb', '#ccffbb', '#bbffcc', '#ccbbff', '#ffbbcc'
];

// グループの角丸長方形の点を生成する関数
const generateRoundedRectPoints = (nodes: FriendNode[]): {
	minX: number,
	minY: number,
	maxX: number,
	maxY: number,
	padding: number
} => {
	// グループ内のノードの座標から最小/最大値を計算
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	nodes.forEach(node => {
		if (node.x && node.y) {
			minX = Math.min(minX, node.x);
			minY = Math.min(minY, node.y);
			maxX = Math.max(maxX, node.x);
			maxY = Math.max(maxY, node.y);
		}
	});

	// パディングを追加（ノードと長方形の間の余白）
	const padding = 40;

	return {
		minX: minX - padding,
		minY: minY - padding,
		maxX: maxX + padding,
		maxY: maxY + padding,
		padding: padding
	};
};

// プレースホルダー画像の生成関数
const createPlaceholderImage = (label: string): string => {
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
			<rect x="0" y="0" width="36" height="36" fill="#eee" />
			<text x="50%" y="50%" font-size="16" text-anchor="middle" dy=".3em" fill="#333">${label}</text>
		</svg>
	`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

interface FriendsGraphProps {
	data: GraphData;
	onSelectFriend?: (friendId: string) => void;
}

const FriendsGraph: React.FC<FriendsGraphProps> = ({ data, onSelectFriend }) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const dimensionsRef = useRef({ width: 1000, height: 500 });

	useEffect(() => {
		const handleResize = () => {
			const aspectRatio = Math.max(Math.min(window.innerHeight / window.innerWidth, 1.1), 0.5);
			dimensionsRef.current = {
				width: 1000,
				height: 1000 * aspectRatio
			};
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	useEffect(() => {
		if (!svgRef.current || !data.nodes.length) return;

		// 既存のSVG要素をクリア
		select(svgRef.current).selectAll('*').remove();

		const { width, height } = dimensionsRef.current;

		// SVGを設定
		const svg = select(svgRef.current)
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', [0, 0, width, height])
			.style('background-color', 'transparent')
			.style('border-radius', '8px')
			.style('touch-action', 'none')
			.style('cursor', 'grab');

		// ズーム機能
		const g = svg.append('g');

		const zoom = d3Zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.2, 4])
			.on('start', (event) => {
				if (event.sourceEvent && event.sourceEvent.type !== 'wheel') {
					svg.style('cursor', 'grabbing');
				}
			})
			.on('zoom', (event) => {
				g.attr('transform', event.transform);
			})
			.on('end', (event) => {
				if (event.sourceEvent && event.sourceEvent.type !== 'wheel') {
					svg.style('cursor', 'grab');
				}
			});

		// 初期ズーム設定（少し引いた状態で表示）
		svg.call(zoom)
			.call(zoom.translateTo, width / 2, height / 2)
			.call(zoom.scaleTo, 0.8); // 初期ズームレベルを0.8に設定

		// ノードとリンクのデータを複製して使用
		const nodes = data.nodes.map(node => ({ ...node }));
		const links = data.links.map(link => ({ ...link }));
		// O(1)ルックアップ用のノードMap
		const nodeMap = new Map(nodes.map(n => [n.id, n]));

		// 全グループ（重複を含む）を収集
		const allGroups = new Map<number, FriendNode[]>();

		// 各ノードの全てのグループを処理
		nodes.forEach(node => {
			if (node.groups) {
				node.groups.forEach(groupId => {
					if (!allGroups.has(groupId)) {
						allGroups.set(groupId, []);
					}
					allGroups.get(groupId)?.push(node);
				});
			}
		});

		const hulls = g.append('g').attr('class', 'hulls');

		// シミュレーション設定
		const simulation = forceSimulation<FriendNode>(nodes)
			.force('link', forceLink<FriendNode, FriendLink>(links)
				.id(d => d.id)
				.distance(100))
			.force('charge', forceManyBody().strength(-1000))
			.force('center', forceCenter(width / 2, height / 2))
			.force('collision', forceCollide().radius(25))
			.force('x', forceX().strength(0.1))
			.force('y', forceY().strength(0.1));

		// 各ノードのグループをSetに変換
		const nodeGroupSets = new Map<string, Set<number>>();
		for (const node of nodes) {
			if (node.groups) {
				nodeGroupSets.set(node.id, new Set(node.groups));
			}
		}

		// グループごとのノード集合を強化するカスタムフォース
		const nodesLen = nodes.length;
		const groupForce = () => {
			for (let i = 0; i < nodesLen; i++) {
				const nodeI = nodes[i];
				if (!nodeI.x || !nodeI.y) continue;
				const groupI = nodeI.group || 0;
				const groupSetI = nodeGroupSets.get(nodeI.id);

				for (let j = i + 1; j < nodesLen; j++) {
					const nodeJ = nodes[j];
					if (!nodeJ.x || !nodeJ.y) continue;
					const groupJ = nodeJ.group || 0;

					// 共通のグループを持つか確認
					let hasCommonGroup = false;
					if (groupSetI) {
						const groupSetJ = nodeGroupSets.get(nodeJ.id);
						if (groupSetJ) {
							for (const g of groupSetI) {
								if (groupSetJ.has(g)) {
									hasCommonGroup = true;
									break;
								}
							}
						}
					}

					if (groupI !== groupJ && !hasCommonGroup) continue;

					// 同じグループ内のノード間に引力を追加
					const dx = nodeJ.x - nodeI.x;
					const dy = nodeJ.y - nodeI.y;
					if (dx === 0 && dy === 0) continue;

					const dist = Math.sqrt(dx * dx + dy * dy);
					const forceStrength = 0.05;
					const fx = (dx / dist) * forceStrength;
					const fy = (dy / dist) * forceStrength;

					nodeI.x += fx;
					nodeI.y += fy;
					nodeJ.x -= fx;
					nodeJ.y -= fy;
				}
			}
		};

		// リンクを描画
		const link = g.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(links)
			.join('line')
			.attr('stroke', '#999')
			.attr('stroke-opacity', 0.6)
			.attr('stroke-width', d => Math.sqrt(d.value) * 2);

		// ノードグループを作成
		const node = g.append('g')
			.attr('class', 'nodes')
			.selectAll('g')
			.data(nodes)
			.join('g')
			.attr('class', 'node')
			.attr('data-friend-id', d => d.id)
			.attr('cursor', 'pointer')
			.on('click', (event, d) => {
				event.stopPropagation();
				if (onSelectFriend) {
					onSelectFriend(d.id);
				}
				if (d.linkUrl) {
					window.open(d.linkUrl, '_blank');
				}
			})
			.call(
				// @ts-expect-error - D3の型定義問題を一時的に回避
				d3Drag<SVGGElement, FriendNode>()
					.on('start', dragstarted)
					.on('drag', dragged)
					.on('end', dragended)
			);

		// ノードの背景円
		node.append('rect')
			.attr('width', 36)
			.attr('height', 36)
			.attr('x', -18)
			.attr('y', -18)
			.attr('fill', d => {
				const groupColor = GROUP_COLORS[d.group ? (d.group % GROUP_COLORS.length) : 0];
				return groupColor || '#eee';
			});

		// 画像用クリップパス
		node.append('clipPath')
			.attr('id', d => `clip-${d.id}`)
			.append('rect')
			.attr('width', 36)
			.attr('height', 36)
			.attr('x', -18)
			.attr('y', -18);

		// 画像またはプレースホルダーを追加
		node.append('image')
			.attr('xlink:href', d => d.iconUrl || createPlaceholderImage(d.name.charAt(0)))
			.attr('x', -18)
			.attr('y', -18)
			.attr('width', 36)
			.attr('height', 36)
			.attr('clip-path', d => `url(#clip-${d.id})`)
			.attr('loading', 'lazy')
			.attr('referrerPolicy', 'no-referrer')
			.on('error', function() {
				select(this).attr('href', createPlaceholderImage('?'));
			});

		// ラベルを追加
		node.append('text')
			.attr('dy', 30)
			.attr('text-anchor', 'middle')
			.text(d => d.name)
			.attr('font-size', '10px')
			.attr('fill', '#000')
			.attr('font-weight', 'bold');

		// 凸包（グループの輪郭）を更新する関数
		function updateHulls() {
			// 既存の凸包を削除
			hulls.selectAll('*').remove();

			// すべてのグループに対して角丸長方形を描画
			allGroups.forEach((groupNodes, groupId) => {
				if (groupNodes.length < 1 || groupId === 0) return; // グループ0または空のグループはスキップ

				const colorIndex = groupId % GROUP_COLORS.length;
				const groupColor = GROUP_COLORS[colorIndex];
				const darkerColor = d3Color(groupColor)?.darker().toString() || '#333';

				try {
					// グループ内のノードから長方形の座標を計算
					const rect = generateRoundedRectPoints(groupNodes);

					// 角の丸みの半径
					const radius = 20;

					// 角丸長方形のパスを作成
					const path = [
						`M ${rect.minX + radius} ${rect.minY}`,
						`H ${rect.maxX - radius}`,
						`Q ${rect.maxX} ${rect.minY} ${rect.maxX} ${rect.minY + radius}`,
						`V ${rect.maxY - radius}`,
						`Q ${rect.maxX} ${rect.maxY} ${rect.maxX - radius} ${rect.maxY}`,
						`H ${rect.minX + radius}`,
						`Q ${rect.minX} ${rect.maxY} ${rect.minX} ${rect.maxY - radius}`,
						`V ${rect.minY + radius}`,
						`Q ${rect.minX} ${rect.minY} ${rect.minX + radius} ${rect.minY}`,
						'Z'
					].join(' ');

					// 角丸長方形を描画
					hulls.append('path')
						.attr('d', path)
						.attr('fill', groupColor)
						.attr('fill-opacity', 0.4)
						.attr('stroke', darkerColor)
						.attr('stroke-width', 2)
						.attr('stroke-opacity', 0.7)
						.attr('stroke-linejoin', 'round')
						.attr('class', `group-${groupId}`)
						.style('pointer-events', 'all')
						.style('touch-action', 'none')
						.lower();
				} catch (e) {
					console.error('角丸長方形の作成に失敗:', groupId, e);
				}
			});
		}

		// シミュレーションの更新処理
		simulation.on('tick', () => {
			// カスタムのグループ引力を適用
			groupForce();

			// ノードの座標を取得するヘルパー関数
			const getNodeCoord = (nodeRef: string | FriendNode, prop: 'x' | 'y'): number => {
				if (typeof nodeRef === 'string') {
					const foundNode = nodeMap.get(nodeRef);
					return Math.round(foundNode?.[prop] || 0);
				}
				return Math.round((nodeRef as FriendNode)[prop] || 0);
			};

			link
				.attr('x1', d => getNodeCoord(d.source, 'x'))
				.attr('y1', d => getNodeCoord(d.source, 'y'))
				.attr('x2', d => getNodeCoord(d.target, 'x'))
				.attr('y2', d => getNodeCoord(d.target, 'y'));

			node.attr('transform', d => `translate(${Math.round(d.x || 0)},${Math.round(d.y || 0)})`);

			// 凸包を更新
			updateHulls();
		});

		// ドラッグイベントハンドラー
		function dragstarted(event: D3DragEvent<SVGGElement, FriendNode, FriendNode>) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
			const nodeElement = select(`[data-friend-id="${event.subject.id}"]`);
			nodeElement.style('cursor', 'grabbing');
		}

		function dragged(event: D3DragEvent<SVGGElement, FriendNode, FriendNode>) {
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}

		function dragended(event: D3DragEvent<SVGGElement, FriendNode, FriendNode>) {
			if (!event.active) simulation.alphaTarget(0);
			event.subject.fx = null;
			event.subject.fy = null;
			const nodeElement = select(`[data-friend-id="${event.subject.id}"]`);
			nodeElement.style('cursor', 'pointer');
		}

		// 初期更新
		updateHulls();

		// シミュレーションの開始
		simulation.alpha(1).restart();

		// クリーンアップ
		return () => {
			simulation.stop();
		};
	}, [data, onSelectFriend]);

	return (
		<div style={{
			width: '100%',
			height: '100%',
			position: 'relative',
			overflow: 'hidden',
			touchAction: 'none'
		}}>
			<svg
				ref={svgRef}
				style={{
					width: '100%',
					height: '100%',
					display: 'block',
					touchAction: 'none'
				}}
			/>
		</div>
	);
};

export default FriendsGraph;