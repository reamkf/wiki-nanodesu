// フレンズ掛け合いグラフの型定義
import { SimulationNodeDatum } from 'd3';

// フレンズノードの型定義
export interface FriendNode extends SimulationNodeDatum {
	id: string; // フレンズID
	name: string; // フレンズ名
	iconUrl: string; // 基本情報から取得するアイコンURL
	linkUrl: string; // フレンズページへのリンクURL
	group?: number; // 所属グループ番号
}

// フレンズ間の掛け合い（エッジ）の型定義
export interface FriendLink {
	source: string; // 掛け合い元フレンズID
	target: string; // 掛け合い先フレンズID
	value: number; // 掛け合いの強さ（1固定）
}

// グラフデータの型定義
export interface GraphData {
	nodes: FriendNode[];
	links: FriendLink[];
}

// CSVから取得するフレンズ掛け合いデータの型定義
export interface RawKakeaiData {
	フレンズ1ID: string;
	フレンズ1名: string;
	フレンズ2ID: string;
	フレンズ2名: string;
}

// CSVから取得するフレンズ基本データの型定義
export interface RawFriendData {
	ID: string;
	名前: string;
	アイコンURL?: string;
}