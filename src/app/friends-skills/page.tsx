import { getSkillsWithFriendsData, getEffectTypes } from "@/utils/friendsSkillsData";
import ClientTabs from "./pageClinet";
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { Metadata } from 'next'
export const metadata: Metadata = {
	title: "スキル別フレンズ一覧 - アプリ版けものフレンズ３wikiなのです🦉",
	description: "スキル別フレンズ一覧",
};

export default async function FriendsSkillsPage() {
	const skillsData = await getSkillsWithFriendsData();
	const effectTypes = await getEffectTypes();

	return (
		<div className="min-h-screen">
			<PageTitle title="スキル別フレンズ一覧" />

			<p className="p-1">
				フレンズのスキルを種類ごとにリスト化しています。<br />
				ただし、自身のみの与ダメージ増加は省略しています。また、状態異常・状態変化関連は
				<SeesaaWikiLink
					href="https://seesaawiki.jp/kemono_friends3_5ch/d/%BE%F5%C2%D6%B0%DB%BE%EF"
					className="hover:underline"
				>
					状態異常のページ
				</SeesaaWikiLink>
				と被るため、このページではまとめていません。<br />
				けものミラクルのものは、全てLv.5での効果を記載しています。
			</p>

			<ClientTabs effectTypes={effectTypes} skillsData={skillsData} />
		</div>
	);
}