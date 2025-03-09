import { generateMetadata } from "../metadata";
import { getAbnormalStatusWithFriendsAndPhotos, getAbnormalStatusTypes } from "@/utils/abnormalStatusData";
import ClientTabs from "./page.client";
import { TableOfContentsData } from "@/components/section/TableOfContents";
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { AbnormalStatusWithFriend } from "@/types/abnormalStatus";
import GoogleSheetsLink from "@/components/LinkWithIcon";

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

	const subcategories = [
		{ id: "give-friends", name: "付与するフレンズ" },
		{ id: "resist-friends", name: "耐性を得るフレンズ" },
		{ id: "remove-friends", name: "解除するフレンズ" },
		{ id: "reduce-resist-friends", name: "耐性を減少させるフレンズ" },
		{ id: "give-resist-photo", name: "耐性を与えるフォト" },
		{ id: "reduce-resist-photo", name: "耐性を減少させるフォト" },
		{ id: "give-photo", name: "付与するフォト" }
	];

	// 状態異常のカテゴリーを構築
	const abnormalStatusCategories: TableOfContentsData[] = abnormalStatusList.map(statusType => {
		return {
			name: statusType,
			id: statusType,
			children: subcategories.map(subcategory => ({
				name: subcategory.name,
				id: `${statusType}-${subcategory.id}`
			}))
		};
	});

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