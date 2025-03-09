import { generateMetadata } from "../metadata";
import { getAbnormalStatusWithFriendsAndPhotos, getAbnormalStatusTypes } from "@/utils/abnormalStatusData";
import ClientTabs from "./page.client";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { AbnormalStatusWithFriend } from "@/types/abnormalStatus";
import GoogleSheetsLink from "@/components/LinkWithIcon";
import { AbnormalStatusSkillEffectType } from "@/types/abnormalStatus";

export const metadata = generateMetadata({
	title: "状態異常一覧",
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

		const friendsChildren = [];
		const photoChildren = [];

		// フレンズの各効果タイプのデータをチェック
		if (friendsData.length > 0) {
			const giveData = friendsData.filter(item => item.effectType === AbnormalStatusSkillEffectType.give);
			const incleaseResistData = friendsData.filter(item => item.effectType === AbnormalStatusSkillEffectType.incleaseResist);
			const decreaseResistData = friendsData.filter(item => item.effectType === AbnormalStatusSkillEffectType.decreaseResist);
			const removeData = friendsData.filter(item => item.effectType === AbnormalStatusSkillEffectType.remove);

			if (giveData.length > 0) {
				friendsChildren.push({ id: `${statusType}-friends-give`, name: "付与" });
			}
			if (incleaseResistData.length > 0) {
				friendsChildren.push({ id: `${statusType}-friends-incleaseResist`, name: "耐性増加" });
			}
			if (decreaseResistData.length > 0) {
				friendsChildren.push({ id: `${statusType}-friends-decreaseResist`, name: "耐性減少" });
			}
			if (removeData.length > 0) {
				friendsChildren.push({ id: `${statusType}-friends-remove`, name: "解除" });
			}
		}

		// フォトの各効果タイプのデータをチェック
		if (photoData.length > 0) {
			const giveData = photoData.filter(item => item.effectType === AbnormalStatusSkillEffectType.give);
			const incleaseResistData = photoData.filter(item => item.effectType === AbnormalStatusSkillEffectType.incleaseResist);
			const decreaseResistData = photoData.filter(item => item.effectType === AbnormalStatusSkillEffectType.decreaseResist);
			const removeData = photoData.filter(item => item.effectType === AbnormalStatusSkillEffectType.remove);

			if (giveData.length > 0) {
				photoChildren.push({ id: `${statusType}-photo-give`, name: "付与" });
			}
			if (incleaseResistData.length > 0) {
				photoChildren.push({ id: `${statusType}-photo-incleaseResist`, name: "耐性増加" });
			}
			if (decreaseResistData.length > 0) {
				photoChildren.push({ id: `${statusType}-photo-decreaseResist`, name: "耐性減少" });
			}
			if (removeData.length > 0) {
				photoChildren.push({ id: `${statusType}-photo-remove`, name: "解除" });
			}
		}

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