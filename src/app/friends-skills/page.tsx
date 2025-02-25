import { getSkillsWithFriendsData, getEffectTypes } from "@/utils/skillsData";
import { Typography } from "@mui/material";
import ClientTabs from "./client-components";

export default async function FriendsSkillsPage() {
	// スキルデータとフレンズデータを結合したデータを取得
	const skillsData = await getSkillsWithFriendsData();
	// 効果種別の一覧を取得
	const effectTypes = await getEffectTypes();

	return (
		<div className="min-h-screen p-4">
			<Typography variant="h4" component="h1" className="mb-6">
				スキル別フレンズ一覧
			</Typography>

			<ClientTabs effectTypes={effectTypes} skillsData={skillsData} />
		</div>
	);
}