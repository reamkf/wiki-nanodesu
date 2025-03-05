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

// 凸包用のポイントを生成（ノードの周囲に複数点を配置）
const generateHullPoints = (nodes: FriendNode[]): [number, number][] => {
	const points: [number, number][] = [];

	nodes.forEach(node => {
		if (node.x && node.y) {
			// ノードの周りに複数の点を配置して滑らかな凸包を作成
			for (let angle = 0; angle < 2 * Math.PI; angle += 0.5) {
				points.push([
					node.x + Math.cos(angle) * 30,
					node.y + Math.sin(angle) * 30
				]);
			}
		}
	});

	return points;
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
	const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

	useEffect(() => {
		const handleResize = () => {
			const container = svgRef.current?.parentElement;
			if (container) {
				setDimensions({
					width: container.clientWidth,
					height: Math.max(600, container.clientHeight)
				});
			}
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
			.style('background-color', '#ffffff')
			.style('border-radius', '8px');

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
			.force('charge', d3.forceManyBody().strength(-500))
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
				} else if (d.linkUrl) {
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

			// すべてのグループに対して凸包を描画
			allGroups.forEach((groupNodes, groupId) => {
				if (groupNodes.length < 1 || groupId === 0) return; // グループ0または空のグループはスキップ

				const colorIndex = groupId % GROUP_COLORS.length;
				const groupColor = GROUP_COLORS[colorIndex];
				const darkerColor = d3.color(groupColor)?.darker().toString() || '#333';

				try {
					// ノードの周りに複数の点を配置して滑らかな凸包を作成
					const points = generateHullPoints(groupNodes);

					// 凸包を計算
					const hullPoints = d3.polygonHull(points);

					if (hullPoints && hullPoints.length > 2) {
						// 滑らかな凸包を描画
						hulls.append('path')
							.attr('d', 'M' + hullPoints.join('L') + 'Z')
							.attr('fill', groupColor)
							.attr('fill-opacity', 0.4)
							.attr('stroke', darkerColor)
							.attr('stroke-width', 2)
							.attr('stroke-opacity', 0.7)
							.attr('stroke-linejoin', 'round')
							.attr('class', `group-${groupId}`)
							.lower();
					}
				} catch (e) {
					console.error('凸包の作成に失敗:', groupId, e);
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
		<div className="w-full h-[600px] md:h-[700px] relative">
			<svg
				ref={svgRef}
				className="w-full h-full border border-gray-200 rounded-lg"
				style={{
					touchAction: 'none' // モバイルでのタッチ操作の改善
				}}
			/>
		</div>
	);
};

export default FriendsGraph;