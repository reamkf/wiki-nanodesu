import { generateMetadata } from "../metadata";
import { getSkillsWithFriendsData, getEffectTypes } from "@/utils/friends/friendsSkillsData";
import ClientTabs from "./page.client";
import { TreeItemData } from "@/components/common/TreeList";
import { PageTitle } from '@/components/PageTitle';
import Link from "next/link";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { SkillWithFriend } from "@/types/friendsSkills";
import GoogleSheetsLink from "@/components/LinkWithIcon";

export const metadata = generateMetadata({
	title: "スキル別フレンズ一覧",
});

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

	const skillCategories: TreeItemData[] = [
		{
			name: "バフ",
			id: "buff",
			children: [
				{
					name: "与ダメージ増加",
					id: "buff-damage-increase",
					children: [
						{ name: "与ダメージ増加", id: "与ダメージ増加" },
						{ name: "Beat!!!与ダメージ増加", id: "Beat!!!与ダメージ増加" },
						{ name: "Action!与ダメージ増加", id: "Action!与ダメージ増加" },
						{ name: "Try!!与ダメージ増加", id: "Try!!与ダメージ増加" },
					]
				},
				{
					name: "被ダメージ減少",
					id: "buff-damage-reduction",
					children: [
						{ name: "被ダメージ減少", id: "被ダメージ減少" },
						{ name: "全体攻撃による被ダメージ減少", id: "全体攻撃による被ダメージ減少" },
					]
				},
				{ name: "攻撃命中率増加", id: "攻撃命中率増加" },
				{ name: "かいひ増加", id: "かいひ増加" },
			]
		},
		{
			name: "デバフ",
			id: "debuff",
			children: [
				{ name: "与ダメージ減少", id: "与ダメージ減少" },
				{
					name: "被ダメージ増加",
					id: "debuff-damage-increase",
					children: [
						{ name: "被ダメージ増加", id: "被ダメージ増加" },
						{ name: "全体攻撃による被ダメージ増加", id: "全体攻撃による被ダメージ増加" },
					]
				},
				{ name: "攻撃命中率減少", id: "攻撃命中率減少" },
				{ name: "かいひ減少", id: "かいひ減少" },
			]
		},
		{
			name: "たいりょく回復",
			id: "hp-recovery",
			children: [
				{ name: "回復", id: "回復" },
				{ name: "毎ターン回復", id: "毎ターン回復" },
				{ name: "吸収", id: "吸収" },
				{ name: "毎ターン回復解除", id: "毎ターン回復解除" },
				{ name: "たいりょく回復量増加", id: "たいりょく回復量増加" },
				{ name: "たいりょく回復量減少", id: "たいりょく回復量減少" },
				{ name: "たいりょく回復量減少状態解除", id: "たいりょく回復量減少状態解除" },
			]
		},
		{
			name: "MP",
			id: "mp",
			children: [
				{ name: "MP増加", id: "MP増加" },
				{ name: "毎ターンMP増加", id: "毎ターンMP増加" },
				{ name: "MP減少", id: "MP減少" },
				{ name: "毎ターンMP減少状態解除", id: "毎ターンMP減少状態解除" },
				{ name: "MP増加量減少状態解除", id: "MP増加量減少状態解除" },
			]
		},
		{
			name: "バフ解除",
			id: "buff-removal",
			children: [
				{ name: "与ダメージ増加状態解除", id: "与ダメージ増加状態解除" },
				{ name: "被ダメージ減少状態解除", id: "被ダメージ減少状態解除" },
				{ name: "攻撃命中率増加状態解除", id: "攻撃命中率増加状態解除" },
				{ name: "かいひ増加状態解除", id: "かいひ増加状態解除" },
			]
		},
		{
			name: "デバフ解除",
			id: "debuff-removal",
			children: [
				{ name: "与ダメージ減少状態解除", id: "与ダメージ減少状態解除" },
				{ name: "被ダメージ増加状態解除", id: "被ダメージ増加状態解除" },
				{ name: "攻撃命中率減少状態解除", id: "攻撃命中率減少状態解除" },
				{ name: "かいひ減少状態解除", id: "かいひ減少状態解除" },
			]
		},
		{
			name: "その他",
			id: "others",
			children: [
				{ name: "プラズムチャージ効果回数追加", id: "プラズムチャージ効果回数追加" },
				{ name: "全体Beat", id: "全体Beat" },
				{ name: "均等割ダメージ", id: "均等割ダメージ" },
				{ name: "コーラス参加", id: "コーラス参加" },
				{ name: "おかわり増加", id: "おかわり増加" },
				{ name: "おかわり最大値増加", id: "おかわり最大値増加" },
				{ name: "たいりょく1で耐える", id: "たいりょく1で耐える" },
				{ name: "ギブアップ復帰", id: "ギブアップ復帰" },
			]
		},
	];

	// デフォルトですべて展開する
	for (const category of skillCategories) {
		category.isExpandedByDefault = true;
		if (category.children) {
			for (const child of category.children) {
				if (child.children) {
					for (const subChild of child.children) {
						subChild.isExpandedByDefault = true;
					}
				}
			}
		}
	}

	return (
		<div className="min-h-screen">
			<PageTitle title="スキル別フレンズ一覧" />

			<p className="p-1">
				フレンズのスキルを種類ごとにリスト化しています。<br />
				ただし、自身のみの与ダメージ増加は省略しています。<br />
				<span className="font-bold">
					状態異常・状態変化関連は
					<Link href="/abnormal-status-skills" className="text-blue-500">状態異常のページ</Link>
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