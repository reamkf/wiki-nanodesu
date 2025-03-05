'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { FriendNode, FriendLink, GraphData } from '@/types/friends-kakeai-graph';

// グループ色の配列
const GROUP_COLORS = [
	'#e6194b', '#3cb44b', '#ffe119', '#4363d8',
	'#f58231', '#911eb4', '#46f0f0', '#f032e6',
	'#bcf60c', '#fabebe', '#008080', '#e6beff',
	'#9a6324', '#fffac8', '#800000', '#aaffc3',
	'#808000', '#ffd8b1', '#000075', '#808080'
];

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
			.style('background-color', '#f8f8f8')
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

		// グループごとに背景を描画
		const groups = d3.group(nodes, node => node.group || 0);
		const hulls = g.append('g').attr('class', 'hulls');

		// シミュレーション設定
		const simulation = d3.forceSimulation<FriendNode>(nodes)
			.force('link', d3.forceLink<FriendNode, FriendLink>(links)
				.id(d => d.id)
				.distance(50))
			.force('charge', d3.forceManyBody().strength(-150))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius(30));

		// リンクを描画
		const link = g.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(links)
			.join('line')
			.attr('stroke', '#999')
			.attr('stroke-opacity', 0.7)
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
			.attr('fill', '#f8f8f8')
			.attr('stroke', d => GROUP_COLORS[d.group ? (d.group % GROUP_COLORS.length) : 0])
			.attr('stroke-width', 2.5);

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
			.attr('font-size', '10px');

		// シミュレーションの更新処理
		simulation.on('tick', () => {
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

			// グループごとに背景を更新
			hulls.selectAll('path').remove();

			groups.forEach((groupNodes, groupId) => {
				if (groupId === 0) return; // グループ0は無視

				// グループ内のノードからポイントを生成
				const points = groupNodes.map(d => [d.x || 0, d.y || 0]);
				if (points.length < 3) return; // 3点以下なら凸包を作れない

				// 凸包を生成
				try {
					const hullPoints = d3.polygonHull(points as [number, number][]);
					if (!hullPoints) return;

					// パスを作成
					const path = d3.line()(
						hullPoints.map(point => [point[0], point[1]])
					);

					hulls.append('path')
						.attr('d', path)
						.attr('fill', GROUP_COLORS[(groupId - 1) % GROUP_COLORS.length])
						.attr('fill-opacity', 0.1)
						.attr('stroke', GROUP_COLORS[(groupId - 1) % GROUP_COLORS.length])
						.attr('stroke-width', 1.5)
						.attr('stroke-opacity', 0.3)
						.lower(); // 背景に移動
				} catch (e) {
					console.error('Failed to create hull for group', groupId, e);
				}
			});
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