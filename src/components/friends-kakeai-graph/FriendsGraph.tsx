'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
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
		<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
			<circle cx="20" cy="20" r="20" fill="#eee" />
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
	const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });

	useEffect(() => {
		const handleResize = () => {
			const aspectRatio = Math.max(Math.min(window.innerHeight / window.innerWidth, 1.1), 0.5);
			setDimensions({
				width: 1000,
				height: 1000 * aspectRatio
			});
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
		d3.select(svgRef.current).selectAll('*').remove();

		const { width, height } = dimensions;

		// SVGを設定
		const svg = d3.select(svgRef.current)
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', [0, 0, width, height])
			.style('background-color', 'transparent')
			.style('border-radius', '8px')
			.style('width', '100%')
			.style('height', '100%')
			.style('touch-action', 'none');

		// ズーム機能
		const g = svg.append('g');

		const zoom = d3.zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.2, 4])
			.on('zoom', (event) => {
				g.attr('transform', event.transform);
			});

		// 初期ズーム設定（少し引いた状態で表示）
		svg.call(zoom)
			.call(zoom.translateTo, width / 2, height / 2)
			.call(zoom.scaleTo, 0.8); // 初期ズームレベルを0.8に設定

		// ノードとリンクのデータを複製して使用
		const nodes = data.nodes.map(node => ({ ...node }));
		const links = data.links.map(link => ({ ...link }));

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
		const simulation = d3.forceSimulation<FriendNode>(nodes)
			.force('link', d3.forceLink<FriendNode, FriendLink>(links)
				.id(d => d.id)
				.distance(100))
			.force('charge', d3.forceManyBody().strength(-1000))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius(30))
			.force('x', d3.forceX().strength(0.1))
			.force('y', d3.forceY().strength(0.1));

		// グループごとのノード集合を強化するカスタムフォース
		const groupForce = () => {
			for (let i = 0; i < nodes.length; i++) {
				const nodeI = nodes[i];
				const groupI = nodeI.group || 0;

				for (let j = i + 1; j < nodes.length; j++) {
					const nodeJ = nodes[j];
					const groupJ = nodeJ.group || 0;

					// 共通のグループを持つノード間に引力を追加
					const hasCommonGroup = nodeI.groups?.some(g => nodeJ.groups?.includes(g));

					if ((groupI === groupJ || hasCommonGroup) && nodeI.x && nodeI.y && nodeJ.x && nodeJ.y) {
						// 同じグループ内のノード間に引力を追加
						const dx = nodeJ.x - nodeI.x;
						const dy = nodeJ.y - nodeI.y;

						if (dx !== 0 || dy !== 0) {
							const forceStrength = 0.05;
							const forceX = (dx / Math.sqrt(dx * dx + dy * dy)) * forceStrength;
							const forceY = (dy / Math.sqrt(dx * dx + dy * dy)) * forceStrength;

							nodeI.x += forceX;
							nodeI.y += forceY;
							nodeJ.x -= forceX;
							nodeJ.y -= forceY;
						}
					}
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
				d3.drag<SVGGElement, FriendNode>()
					.on('start', dragstarted)
					.on('drag', dragged)
					.on('end', dragended)
			);

		// ノードの背景円
		node.append('circle')
			.attr('r', 20)
			.attr('fill', d => {
				const groupColor = GROUP_COLORS[d.group ? (d.group % GROUP_COLORS.length) : 0];
				return groupColor || '#eee';
			})
			.attr('stroke', '#fff')
			.attr('stroke-width', 1.5);

		// 画像用クリップパス
		node.append('clipPath')
			.attr('id', d => `clip-${d.id}`)
			.append('circle')
			.attr('r', 18);

		// 画像またはプレースホルダーを追加
		node.append('image')
			.attr('xlink:href', d => d.iconUrl || createPlaceholderImage(d.name.charAt(0)))
			.attr('x', -18)
			.attr('y', -18)
			.attr('width', 36)
			.attr('height', 36)
			.attr('clip-path', d => `url(#clip-${d.id})`)
			.on('error', function() {
				d3.select(this).attr('href', createPlaceholderImage('?'));
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
				const darkerColor = d3.color(groupColor)?.darker().toString() || '#333';

				try {
					// グループ内のノードから長方形の座標を計算
					const rect = generateRoundedRectPoints(groupNodes);

					// 角の丸みの半径
					const radius = 20;

					// 角丸長方形のパスを作成
					const path = `
						M ${rect.minX + radius} ${rect.minY}
						H ${rect.maxX - radius}
						Q ${rect.maxX} ${rect.minY} ${rect.maxX} ${rect.minY + radius}
						V ${rect.maxY - radius}
						Q ${rect.maxX} ${rect.maxY} ${rect.maxX - radius} ${rect.maxY}
						H ${rect.minX + radius}
						Q ${rect.minX} ${rect.maxY} ${rect.minX} ${rect.maxY - radius}
						V ${rect.minY + radius}
						Q ${rect.minX} ${rect.minY} ${rect.minX + radius} ${rect.minY}
						Z
					`.replace(/\s+/g, ' ').trim();

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

			link
				.attr('x1', d => {
					const source = typeof d.source === 'string' ?
						data.nodes.find(node => node.id === d.source) :
						d.source as FriendNode;
					return source?.x || 0;
				})
				.attr('y1', d => {
					const source = typeof d.source === 'string' ?
						data.nodes.find(node => node.id === d.source) :
						d.source as FriendNode;
					return source?.y || 0;
				})
				.attr('x2', d => {
					const target = typeof d.target === 'string' ?
						data.nodes.find(node => node.id === d.target) :
						d.target as FriendNode;
					return target?.x || 0;
				})
				.attr('y2', d => {
					const target = typeof d.target === 'string' ?
						data.nodes.find(node => node.id === d.target) :
						d.target as FriendNode;
					return target?.y || 0;
				});

			node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

			// 凸包を更新
			updateHulls();
		});

		// ドラッグイベントハンドラー
		function dragstarted(event: d3.D3DragEvent<SVGGElement, FriendNode, FriendNode>) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
		}

		function dragged(event: d3.D3DragEvent<SVGGElement, FriendNode, FriendNode>) {
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}

		function dragended(event: d3.D3DragEvent<SVGGElement, FriendNode, FriendNode>) {
			if (!event.active) simulation.alphaTarget(0);
			event.subject.fx = null;
			event.subject.fy = null;
		}

		// 初期更新
		updateHulls();

		// シミュレーションの開始
		simulation.alpha(1).restart();

		// クリーンアップ
		return () => {
			simulation.stop();
		};
	}, [data, dimensions, onSelectFriend]);

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