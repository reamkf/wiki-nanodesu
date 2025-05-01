import { generateMetadata } from "../metadata";
import { getSkillsWithFriendsData, getEffectTypes } from "@/data/friendsSkillsData";
import ClientTabs from "./page.client";
import { TreeItemData } from "@/components/common/TreeList";
import { PageTitle } from '@/components/PageTitle';
import { NanodesuLink } from "@/components/common/NanodesuLink";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { SkillWithFriend } from "@/types/friendsSkills";
import GoogleSheetsLink from "@/components/GoogleSheetsLink";

// --- 定数定義 ---

// スキルカテゴリの構造定義
// id が name と同じ場合は省略
const SKILL_CATEGORIES_STRUCTURE = [
	{
		name: "バフ",
		id: "buff",
		children: [
			{
				name: "与ダメージ増加",
				id: "buff-damage-increase",
				children: [
					{ name: "与ダメージ増加" },
					{ name: "Beat!!!与ダメージ増加" },
					{ name: "Action!与ダメージ増加" },
					{ name: "Try!!与ダメージ増加" },
				]
			},
			{
				name: "被ダメージ減少",
				id: "buff-damage-reduction",
				children: [
					{ name: "被ダメージ減少" },
					{ name: "全体攻撃による被ダメージ減少" },
				]
			},
			{ name: "攻撃命中率増加" },
			{ name: "かいひ増加" },
		]
	},
	{
		name: "デバフ",
		id: "debuff",
		children: [
			{ name: "与ダメージ減少" },
			{
				name: "被ダメージ増加",
				id: "debuff-damage-increase",
				children: [
					{ name: "被ダメージ増加" },
					{ name: "全体攻撃による被ダメージ増加" },
				]
			},
			{ name: "攻撃命中率減少" },
			{ name: "かいひ減少" },
		]
	},
	{
		name: "たいりょく回復",
		id: "hp-recovery",
		children: [
			{ name: "回復" },
			{ name: "毎ターン回復" },
			{ name: "吸収" },
			{ name: "毎ターン回復解除" },
			{ name: "たいりょく回復量増加" },
			{ name: "たいりょく回復量減少" },
			{ name: "たいりょく回復量減少状態解除" },
		]
	},
	{
		name: "MP",
		id: "mp",
		children: [
			{ name: "MP増加" },
			{ name: "毎ターンMP増加" },
			{ name: "MP減少" },
			{ name: "毎ターンMP減少状態解除" },
			{ name: "MP増加量減少状態解除" },
		]
	},
	{
		name: "バフ解除",
		id: "buff-removal",
		children: [
			{ name: "与ダメージ増加状態解除" },
			{ name: "被ダメージ減少状態解除" },
			{ name: "攻撃命中率増加状態解除" },
			{ name: "かいひ増加状態解除" },
		]
	},
	{
		name: "デバフ解除",
		id: "debuff-removal",
		children: [
			{ name: "与ダメージ減少状態解除" },
			{ name: "被ダメージ増加状態解除" },
			{ name: "攻撃命中率減少状態解除" },
			{ name: "かいひ減少状態解除" },
		]
	},
	{
		name: "その他",
		id: "others",
		children: [
			{ name: "プラズムチャージ効果回数追加" },
			{ name: "全体Beat" },
			{ name: "均等割ダメージ" },
			{ name: "コーラス参加" },
			{ name: "おかわり増加" },
			{ name: "おかわり最大値増加" },
			{ name: "たいりょく1で耐える" },
			{ name: "ギブアップ復帰" },
		]
	},
];

// 型エイリアス: idがオプショナルなTreeItemData
type InputTreeItemData = Omit<TreeItemData, 'id' | 'children'> & { id?: string; children?: InputTreeItemData[] };

// --- ヘルパー関数 ---

/**
 * TreeItemDataの配列に再帰的に isExpandedByDefault: true を追加し、idがない場合はnameで補完する関数
 * @param items idがオプショナルなTreeItemDataの配列
 * @returns idが補完され、isExpandedByDefaultが追加された新しいTreeItemDataの配列
 */
function processCategoryStructure(items: InputTreeItemData[] | undefined): TreeItemData[] | undefined {
	if (!items) return undefined;
	return items.map(item => {
		const newItem: TreeItemData = {
			...item,
			id: item.id ?? item.name, // id がなければ name で補完
			isExpandedByDefault: true,
			children: processCategoryStructure(item.children) // 子要素にも再帰的に適用
		};
		return newItem;
	});
}

// --- メタデータ ---

export const metadata = generateMetadata({
	title: "スキル別フレンズ一覧",
});

// --- ページコンポーネント ---

export default async function FriendsSkillsPage() {
	const skillsData = await getSkillsWithFriendsData();
	const effectTypes = await getEffectTypes();

	// 効果種別ごとにデータをフィルタリング
	const effectTypeData: Record<string, SkillWithFriend[]> = {};
	effectTypes.forEach(effectType => {
		effectTypeData[effectType] = skillsData.filter(
			skill => skill.effectType === effectType
		);
	});

	// カテゴリ構造を処理して、id補完とデフォルト展開フラグを追加
	const skillCategories = processCategoryStructure(SKILL_CATEGORIES_STRUCTURE as InputTreeItemData[]) || [];

	return (
		<div className="min-h-screen">
			<PageTitle title="スキル別フレンズ一覧" />

			<p className="p-1">
				フレンズのスキルを種類ごとにリスト化しています。<br />
				ただし、自身のみの与ダメージ増加は省略しています。<br />
				<span className="font-bold">
					状態異常・状態変化関連は
					<NanodesuLink href="/abnormal-status-skills">状態異常のページ</NanodesuLink>
					と被るため、このページではまとめていません。<br />
				</span>
				けものミラクルのものは、全てLv.5での効果を記載しています。
			</p>
			<p className="p-1">
				このページのデータは下記のスプレッドシートで管理しています。
				データの修正はスプレッドシート上で行ってください。<br />
				<GoogleSheetsLink
					link="https://docs.google.com/spreadsheets/d/1p-C3wbkYZf_2Uce2J2J6w6T1V6X5eJmk-PtC4I__olk/edit?gid=308387785#gid=308387785"
				/>
			</p>
			<p className="p-1">
				誤字・誤植の報告は
				<SeesaaWikiLink
					href="スキル効果別フレンズ一覧"
				>
					こちら
				</SeesaaWikiLink>
				のコメント欄へお願いします。
			</p>

			<ClientTabs
				effectTypes={effectTypes}
				effectTypeData={effectTypeData}
				skillCategories={skillCategories}
			/>
		</div>
	);
}