import { generateMetadata } from "../metadata";
import { getAbnormalStatusWithFriendsAndPhotos, getAbnormalStatusTypes } from "@/utils/abnormalStatusData";
import ClientTabs from "./page.client";
import { TreeItemData } from "@/components/common/TreeList";
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import {
	AbnormalStatusWithFriend,
	AbnormalStatusSkillEffectType,
	getPowerPriority,
	getActivationRatePriority,
	getSkillTypePriority,
	getTargetPriority
} from "@/types/abnormalStatus";
import GoogleSheetsLink from "@/components/LinkWithIcon";
import { FriendsAttribute, FriendsAttributeOrder } from "@/types/friends";
import { PhotoAttribute, photoAttributeOrder } from "@/types/photo";

// 効果タイプの値からIDを取得するマッピング
const EFFECT_TYPE_VALUE_TO_ID = Object.fromEntries(
	Object.entries(AbnormalStatusSkillEffectType).map(
		([key, value]) => [value, key]
	)
) as Record<AbnormalStatusSkillEffectType, keyof typeof AbnormalStatusSkillEffectType>;

function sortByAttribute(data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] {
	return [...data].sort((a, b) => {
		// 属性でソート (FriendsAttributeOrderとphotoAttributeOrderの昇順)
		const attributeA = a.isPhoto ? a.photoDataRow?.attribute || '' : a.friendsDataRow?.attribute || '';
		const attributeB = b.isPhoto ? b.photoDataRow?.attribute || '' : b.friendsDataRow?.attribute || '';

		// フレンズとフォトで異なる属性順序を適用
		let orderA = 999;
		let orderB = 999;

		if (a.isPhoto) {
			// フォトの場合
			orderA = attributeA ? photoAttributeOrder[attributeA as PhotoAttribute] ?? 999 : 999;
		} else {
			// フレンズの場合
			orderA = attributeA ? FriendsAttributeOrder[attributeA as FriendsAttribute] ?? 999 : 999;
		}

		if (b.isPhoto) {
			// フォトの場合
			orderB = attributeB ? photoAttributeOrder[attributeB as PhotoAttribute] ?? 999 : 999;
		} else {
			// フレンズの場合
			orderB = attributeB ? FriendsAttributeOrder[attributeB as FriendsAttribute] ?? 999 : 999;
		}

		return orderA - orderB; // 昇順
	});
}

function sortGiveSkills(data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] {
	return [...data].sort((a, b) => {
		// 1. 属性でソート (FriendsAttributeOrderとphotoAttributeOrderの昇順)
		const attributeA = a.isPhoto ? a.photoDataRow?.attribute || '' : a.friendsDataRow?.attribute || '';
		const attributeB = b.isPhoto ? b.photoDataRow?.attribute || '' : b.friendsDataRow?.attribute || '';

		// フレンズとフォトで異なる属性順序を適用
		let orderA = 999;
		let orderB = 999;

		if (a.isPhoto) {
			// フォトの場合
			orderA = attributeA ? photoAttributeOrder[attributeA as PhotoAttribute] ?? 999 : 999;
		} else {
			// フレンズの場合
			orderA = attributeA ? FriendsAttributeOrder[attributeA as FriendsAttribute] ?? 999 : 999;
		}

		if (b.isPhoto) {
			// フォトの場合
			orderB = attributeB ? photoAttributeOrder[attributeB as PhotoAttribute] ?? 999 : 999;
		} else {
			// フレンズの場合
			orderB = attributeB ? FriendsAttributeOrder[attributeB as FriendsAttribute] ?? 999 : 999;
		}

		if (orderA !== orderB) return orderA - orderB; // 昇順

		// 2. 付与率でソート
		const ratePriorityA = getActivationRatePriority(a.activationRate);
		const ratePriorityB = getActivationRatePriority(b.activationRate);

		if (ratePriorityA !== ratePriorityB) return ratePriorityB - ratePriorityA; // 付与率は降順

		// 3. 威力でソート
		const powerPriorityA = getPowerPriority(a.power);
		const powerPriorityB = getPowerPriority(b.power);
		return powerPriorityB - powerPriorityA;
	});
}

function sortResistanceSkills(data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] {
	return [...data].sort((a, b) => {
		// 1. 対象でソート（味方全体 > 自身を除く味方全体 > 自身）
		const targetPriorityA = getTargetPriority(a.target);
		const targetPriorityB = getTargetPriority(b.target);
		if (targetPriorityA !== targetPriorityB) return targetPriorityB - targetPriorityA;

		// 2. 属性でソート (FriendsAttributeOrderの昇順)
		const attributeA = a.isPhoto ? a.photoDataRow?.attribute || '' : a.friendsDataRow?.attribute || '';
		const attributeB = b.isPhoto ? b.photoDataRow?.attribute || '' : b.friendsDataRow?.attribute || '';

		// フレンズとフォトで異なる属性順序を適用
		let orderA = 999;
		let orderB = 999;

		if (a.isPhoto) {
			// フォトの場合
			orderA = attributeA ? photoAttributeOrder[attributeA as PhotoAttribute] ?? 999 : 999;
		} else {
			// フレンズの場合
			orderA = attributeA ? FriendsAttributeOrder[attributeA as FriendsAttribute] ?? 999 : 999;
		}

		if (b.isPhoto) {
			// フォトの場合
			orderB = attributeB ? photoAttributeOrder[attributeB as PhotoAttribute] ?? 999 : 999;
		} else {
			// フレンズの場合
			orderB = attributeB ? FriendsAttributeOrder[attributeB as FriendsAttribute] ?? 999 : 999;
		}

		if (orderA !== orderB) return orderA - orderB; // 昇順

		// 3. 威力でソート（高 > 大 > 中 > 低 > 小）
		const powerPriorityA = getPowerPriority(a.power);
		const powerPriorityB = getPowerPriority(b.power);
		if (powerPriorityA !== powerPriorityB) return powerPriorityB - powerPriorityA;

		// 4. わざ種別でソート（とくせい・キセキとくせい・なないろとくせい > その他）
		const skillTypePriorityA = getSkillTypePriority(a.skillType);
		const skillTypePriorityB = getSkillTypePriority(b.skillType);
		return skillTypePriorityB - skillTypePriorityA;
	});
}

export const metadata = generateMetadata({
	title: "状態異常スキル一覧",
});

export default async function AbnormalStatusPage() {
	const statusData = await getAbnormalStatusWithFriendsAndPhotos();
	const statusTypes = await getAbnormalStatusTypes();

	// 状態異常ごとにデータをフィルタリング
	const statusTypeData: Record<string, AbnormalStatusWithFriend[]> = {};
	statusTypes.forEach(statusType => {
		const filteredData = statusData.filter(
			status => status.abnormalStatus === statusType
		);

		// 状態異常タイプごとのデータもサーバー側でソート
		// デフォルトでは属性順でソート
		statusTypeData[statusType] = sortByAttribute(filteredData);
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
	const abnormalStatusCategories: TreeItemData[] = abnormalStatusList.map(statusType => {
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
				// 効果タイプでフィルタリング
				let data = friendsData.filter(item => item.effectType === effectType);
				if (data.length === 0) return null;

				// サーバー側でデフォルトソートを適用
				const effectTypeId = EFFECT_TYPE_VALUE_TO_ID[effectType];
				if (effectTypeId === 'incleaseResist' || effectTypeId === 'decreaseResist') {
					// 耐性増加/減少スキルには特別なソートを適用
					data = sortResistanceSkills(data);
				} else if (effectTypeId === 'give') {
					// 付与スキルには属性+付与率でソート
					data = sortGiveSkills(data);
				} else {
					// その他のカテゴリーには属性のみでソート
					data = sortByAttribute(data);
				}

				// データをstatusTypeDataに保存し直す
				statusTypeData[`${statusType}-friends-${effectTypeId}`] = data;

				return {
					id: `${statusType}-friends-${effectTypeId}`,
					name: effectType as string
				};
			})
			.filter((item): item is { id: string; name: string } => item !== null);

		// フォトの子カテゴリを構築
		const photoChildren = effectTypes
			.map(effectType => {
				// 効果タイプでフィルタリング
				let data = photoData.filter(item => item.effectType === effectType);
				if (data.length === 0) return null;

				// サーバー側でデフォルトソートを適用
				const effectTypeId = EFFECT_TYPE_VALUE_TO_ID[effectType];
				if (effectTypeId === 'incleaseResist' || effectTypeId === 'decreaseResist') {
					// 耐性増加/減少スキルには特別なソートを適用
					data = sortResistanceSkills(data);
				} else if (effectTypeId === 'give') {
					// 付与スキルには属性+付与率でソート
					data = sortGiveSkills(data);
				} else {
					// その他のカテゴリーには属性のみでソート
					data = sortByAttribute(data);
				}

				// データをstatusTypeDataに保存し直す
				statusTypeData[`${statusType}-photo-${effectTypeId}`] = data;

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
				children: friendsChildren,
				isExpandedByDefault: true
			});
		}

		// フォトのデータがある場合
		if (photoChildren.length > 0) {
			children.push({
				name: "フォト",
				id: `${statusType}-photo`,
				children: photoChildren,
				isExpandedByDefault: true
			});
		}

		// 子要素がない場合はnullを返す
		if (children.length === 0) {
			return null;
		}

		return {
			name: statusType,
			id: statusType,
			children: children,
			isExpandedByDefault: false
		};
	}).filter(category => category !== null); // nullを除外

	return (
		<div className="min-h-screen">
			<PageTitle title="状態異常スキル一覧" />

			<p className="p-1">
				フレンズとフォトの状態異常付与や耐性増加スキルの一覧です。<br />
				状態異常の効果の説明は書いていません。代わりに
				<SeesaaWikiLink
					href="https://seesaawiki.jp/kemono_friends3_5ch/d/%BE%F5%C2%D6%B0%DB%BE%EF"
				>
					こちら
				</SeesaaWikiLink>
				を参照してください。
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