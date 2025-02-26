import { getSkillsWithFriendsData, getEffectTypes } from "@/utils/friendsSkillsData";
import ClientTabs from "./client-components";
import { PageTitle } from '@/components/PageTitle';

export default async function FriendsSkillsPage() {
	// スキルデータとフレンズデータを結合したデータを取得
	const skillsData = await getSkillsWithFriendsData();
	// 効果種別の一覧を取得
	const effectTypes = await getEffectTypes();

	return (
		<div className="min-h-screen p-4">
			<PageTitle title="スキル別フレンズ一覧" />

			<ClientTabs effectTypes={effectTypes} skillsData={skillsData} />
		</div>
	);
}