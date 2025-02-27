import { getSkillsWithFriendsData, getEffectTypes } from "@/utils/friendsSkillsData";
import ClientTabs from "./pageClinet";
import { PageTitle } from '@/components/PageTitle';
import Link from "next/link";
import { Metadata } from 'next'
export const metadata: Metadata = {
	title: "スキル別フレンズ一覧 - アプリ版けものフレンズ３wikiなのです🦉",
	description: "スキル別フレンズ一覧",
};

export default async function FriendsSkillsPage() {
	// スキルデータとフレンズデータを結合したデータを取得
	const skillsData = await getSkillsWithFriendsData();
	// 効果種別の一覧を取得
	const effectTypes = await getEffectTypes();

	return (
		<div className="min-h-screen">
			<PageTitle title="スキル別フレンズ一覧" />

			<p className="p-1">
				フレンズのスキルを種類ごとにリスト化しています。<br />
				ただし、自身のみの与ダメージ増加は省略しています。また、状態異常・状態変化関連は
				<Link
					href="https://seesaawiki.jp/kemono_friends3_5ch/d/%BE%F5%C2%D6%B0%DB%BE%EF"
					className="hover:underline"
					target="_blank"
					rel="noopener noreferrer"
				>
					状態異常のページ
				</Link>
				と被るため、このページではまとめていません。<br />
				けものミラクルのものは、全てLv.5での効果を記載しています。
			</p>

			<ClientTabs effectTypes={effectTypes} skillsData={skillsData} />
		</div>
	);
}