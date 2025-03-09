import { generateMetadata } from "../metadata";
import { getAbnormalStatusWithFriendsAndPhotos, getAbnormalStatusTypes } from "@/utils/abnormalStatusData";
import ClientTabs from "./page.client";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { AbnormalStatusWithFriend, AbnormalStatusSkillEffectType } from "@/types/abnormalStatus";
import GoogleSheetsLink from "@/components/LinkWithIcon";

// 効果タイプの値からIDを取得するマッピング
const EFFECT_TYPE_VALUE_TO_ID = Object.fromEntries(
	Object.entries(AbnormalStatusSkillEffectType).map(
		([key, value]) => [value, key]
	)
) as Record<AbnormalStatusSkillEffectType, keyof typeof AbnormalStatusSkillEffectType>;

export const metadata = generateMetadata({
	title: "状態異常スキル一覧",
});

export default async function AbnormalStatusPage() {
	const statusData = await getAbnormalStatusWithFriendsAndPhotos();
	const statusTypes = await getAbnormalStatusTypes();

	// 状態異常ごとにデータをフィルタリング
	const statusTypeData: Record<string, AbnormalStatusWithFriend[]> = {};
	statusTypes.forEach(statusType => {
		statusTypeData[statusType] = statusData.filter(
			status => status.abnormalStatus === statusType
		);
	});

	// 状態異常とそのサブカテゴリのリスト
	const abnormalStatusList = [
		"くらくら",
		"どく",
		"すやすや",
		"くたくた",
		"ひやひや",
		"ズキンズキン",
		"からげんき",
		"ぼんやりうっかり",
		"しょんぼりきぶん",
		"びりびり",
		"ちぐはぐリズム",
		"ロストフラッグ",
		"ばてばてヒリヒリ",
		"あせあせ",
		"全ての状態異常に関連した能力",
		"ルンルンきぶん",
		"はねかえし",
		"はねかえしむし",
		"毎ターンMP減少",
		"かばう",
		"ためこみ上手",
		"コチョコチョマスター",
		"いかく",
		"かくれみ"
	];

	// 状態異常のカテゴリーを構築
	const abnormalStatusCategories: TableOfContentsData[] = abnormalStatusList.map(statusType => {
		const statusData = statusTypeData[statusType] || [];

		// データがない場合はnullを返す
		if (statusData.length === 0) {
			return null;
		}

		// フレンズのデータとフォトのデータを分ける
		const friendsData = statusData.filter(item => !item.isPhoto);
		const photoData = statusData.filter(item => item.isPhoto);

		// 効果タイプの配列
		const effectTypes = Object.values(AbnormalStatusSkillEffectType);

		// フレンズの子カテゴリを構築
		const friendsChildren = effectTypes
			.map(effectType => {
				const data = friendsData.filter(item => item.effectType === effectType);
				if (data.length === 0) return null;

				const effectTypeId = EFFECT_TYPE_VALUE_TO_ID[effectType];
				return {
					id: `${statusType}-friends-${effectTypeId}`,
					name: effectType as string
				};
			})
			.filter((item): item is { id: string; name: string } => item !== null);

		// フォトの子カテゴリを構築
		const photoChildren = effectTypes
			.map(effectType => {
				const data = photoData.filter(item => item.effectType === effectType);
				if (data.length === 0) return null;

				const effectTypeId = EFFECT_TYPE_VALUE_TO_ID[effectType];
				return {
					id: `${statusType}-photo-${effectTypeId}`,
					name: effectType as string
				};
			})
			.filter((item): item is { id: string; name: string } => item !== null);

		const children = [];

		// フレンズのデータがある場合
		if (friendsChildren.length > 0) {
			children.push({
				name: "フレンズ",
				id: `${statusType}-friends`,
				children: friendsChildren
			});
		}

		// フォトのデータがある場合
		if (photoChildren.length > 0) {
			children.push({
				name: "フォト",
				id: `${statusType}-photo`,
				children: photoChildren
			});
		}

		// 子要素がない場合はnullを返す
		if (children.length === 0) {
			return null;
		}

		return {
			name: statusType,
			id: statusType,
			children: children
		};
	}).filter(category => category !== null); // nullを除外

	return (
		<div className="min-h-screen">
			<PageTitle title="状態異常一覧" />

			<p className="p-1">
				フレンズとフォトの状態異常スキルをリスト化しています。<br />
				けものミラクルのものは、全てLv.5での効果を記載しています。
			</p>
			<p className="p-1">
				このページのデータは下記のスプレッドシートで管理しています。
				データの修正はスプレッドシート上で行ってください。<br />
				<GoogleSheetsLink
					link="https://docs.google.com/spreadsheets/d/1p-C3wbkYZf_2Uce2J2J6w6T1V6X5eJmk-PtC4I__olk/edit?gid=1025979990#gid=1025979990"
				/>
			</p>
			<p className="p-1">
				誤字・誤植の報告は
				<SeesaaWikiLink
					href="https://seesaawiki.jp/kemono_friends3_5ch/d/%BE%F5%C2%D6%B0%DB%BE%EF"
				>
					こちら
				</SeesaaWikiLink>
				のコメント欄へお願いします。
			</p>

			<ClientTabs
				statusTypes={statusTypes}
				statusTypeData={statusTypeData}
				abnormalStatusCategories={abnormalStatusCategories}
			/>
		</div>
	);
}