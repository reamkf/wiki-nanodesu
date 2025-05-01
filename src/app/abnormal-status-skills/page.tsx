import { generateMetadata } from "../metadata";
import { getAbnormalStatusWithFriendsAndPhotos, getAbnormalStatusTypes } from "@/data/abnormalStatusData";
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
import GoogleSheetsLink from "@/components/GoogleSheetsLink";
import { sortAttribute } from "@/utils/friends/friends";

// 効果タイプの値からIDを取得するマッピング
const EFFECT_TYPE_VALUE_TO_ID = Object.fromEntries(
	Object.entries(AbnormalStatusSkillEffectType).map(
		([key, value]) => [value, key]
	)
) as Record<AbnormalStatusSkillEffectType, keyof typeof AbnormalStatusSkillEffectType>;

/**
 * 指定された属性に基づいて状態異常データをソートする関数
 * @param data ソート対象のデータ配列
 * @returns ソートされたデータ配列
 */
function sortByAttribute(data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] {
	return [...data].sort((a, b) => {
		const attributeA = a.isPhoto ? a.photoDataRow?.attribute : a.friendsDataRow?.attribute;
		const attributeB = b.isPhoto ? b.photoDataRow?.attribute : b.friendsDataRow?.attribute;

		if (attributeA === undefined || attributeB === undefined) {
			return 0; // 属性がない場合は順序を変えない
		}

		// sortAttributeは昇順ソートなので、逆順にするために-1をかける
		return -sortAttribute(attributeA, attributeB);
	});
}

/**
 * 付与スキル（通常）のソート関数
 * @param data ソート対象のデータ配列
 * @returns ソートされたデータ配列
 */
function sortGiveSkills(data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] {
	return [...data].sort((a, b) => {
		// 1. 属性でソート (昇順)
		const attributeA = a.isPhoto ? a.photoDataRow?.attribute : a.friendsDataRow?.attribute;
		const attributeB = b.isPhoto ? b.photoDataRow?.attribute : b.friendsDataRow?.attribute;
		if (attributeA !== undefined && attributeB !== undefined) {
			const sortResult = -sortAttribute(attributeA, attributeB); // 属性は昇順
			if (sortResult !== 0) return sortResult;
		}

		// 2. 付与率でソート (降順)
		const ratePriorityA = getActivationRatePriority(a.activationRate);
		const ratePriorityB = getActivationRatePriority(b.activationRate);
		if (ratePriorityA !== ratePriorityB) return ratePriorityB - ratePriorityA;

		// 3. 威力でソート (降順)
		const powerPriorityA = getPowerPriority(a.power);
		const powerPriorityB = getPowerPriority(b.power);
		if (powerPriorityA !== powerPriorityB) return powerPriorityB - powerPriorityA;

		return 0; // 上記以外は順序を変えない
	});
}

/**
 * 耐性スキル（増加/減少）のソート関数
 * @param data ソート対象のデータ配列
 * @returns ソートされたデータ配列
 */
function sortResistanceSkills(data: AbnormalStatusWithFriend[]): AbnormalStatusWithFriend[] {
	return [...data].sort((a, b) => {
		// 1. 対象でソート (降順)
		const targetPriorityA = getTargetPriority(a.target);
		const targetPriorityB = getTargetPriority(b.target);
		if (targetPriorityA !== targetPriorityB) return targetPriorityB - targetPriorityA;

		// 2. 属性でソート (昇順)
		const attributeA = a.isPhoto ? a.photoDataRow?.attribute : a.friendsDataRow?.attribute;
		const attributeB = b.isPhoto ? b.photoDataRow?.attribute : b.friendsDataRow?.attribute;
		if (attributeA !== undefined && attributeB !== undefined) {
			const sortResult = -sortAttribute(attributeA, attributeB); // 属性は昇順
			if (sortResult !== 0) return sortResult;
		}

		// 3. 威力でソート (降順)
		const powerPriorityA = getPowerPriority(a.power);
		const powerPriorityB = getPowerPriority(b.power);
		if (powerPriorityA !== powerPriorityB) return powerPriorityB - powerPriorityA;

		// 4. わざ種別でソート (降順)
		const skillTypePriorityA = getSkillTypePriority(a.skillType);
		const skillTypePriorityB = getSkillTypePriority(b.skillType);
		if (skillTypePriorityA !== skillTypePriorityB) return skillTypePriorityB - skillTypePriorityA;

		return 0; // 上記以外は順序を変えない
	});
}

/**
 * カテゴリIDを生成するヘルパー関数
 * @param statusType 状態異常タイプ
 * @param entityType エンティティタイプ ('friends' or 'photo')
 * @param effectTypeId 効果タイプID
 * @returns カテゴリID文字列
 */
const createCategoryId = (statusType: string, entityType: 'friends' | 'photo', effectTypeId: string) =>
	`${statusType}-${entityType}-${effectTypeId}`;

/**
 * 特定の効果タイプに基づいてデータをソートする関数
 * @param data ソート対象のデータ配列
 * @param effectType 効果タイプ
 * @returns ソートされたデータ配列
 */
function sortDataByEffectType(data: AbnormalStatusWithFriend[], effectType: AbnormalStatusSkillEffectType): AbnormalStatusWithFriend[] {
	const effectTypeId = EFFECT_TYPE_VALUE_TO_ID[effectType];
	switch (effectTypeId) {
		case 'incleaseResist':
		case 'decreaseResist':
			return sortResistanceSkills(data);
		case 'give':
			return sortGiveSkills(data);
		default:
			// その他のカテゴリーには属性のみでソート
			return sortByAttribute(data);
	}
}

/**
 * 指定されたエンティティタイプと効果タイプに基づいて子カテゴリを構築する関数
 * @param statusType 状態異常タイプ
 * @param entityData エンティティデータ (フレンズまたはフォトのデータ)
 * @param entityType エンティティタイプ ('friends' or 'photo')
 * @param statusTypeData 状態異常タイプごとのデータ（更新用）
 * @returns 子カテゴリの配列
 */
function buildSubCategories(
	statusType: string,
	entityData: AbnormalStatusWithFriend[],
	entityType: 'friends' | 'photo',
	statusTypeData: Record<string, AbnormalStatusWithFriend[]>
): TreeItemData[] {
	const effectTypes = Object.values(AbnormalStatusSkillEffectType);

	return effectTypes
		.map(effectType => {
			// 効果タイプでフィルタリング
			const filteredData = entityData.filter(item => item.effectType === effectType);
			if (filteredData.length === 0) return null;

			// データをソート
			const sortedData = sortDataByEffectType(filteredData, effectType);

			// カテゴリIDを生成し、ソート済みデータを保存
			const effectTypeId = EFFECT_TYPE_VALUE_TO_ID[effectType];
			const categoryId = createCategoryId(statusType, entityType, effectTypeId);
			statusTypeData[categoryId] = sortedData; // データを更新

			return {
				id: categoryId,
				name: effectType as string
			};
		})
		.filter((item): item is TreeItemData => item !== null);
}

export const metadata = generateMetadata({
	title: "状態異常スキル一覧",
});

export default async function AbnormalStatusPage() {
	const allStatusData = await getAbnormalStatusWithFriendsAndPhotos();
	const statusTypes = await getAbnormalStatusTypes();

	// 事前に状態異常タイプごとにデータをグループ化しておく
	const groupedDataByType: Record<string, AbnormalStatusWithFriend[]> = {};
	statusTypes.forEach(type => {
		groupedDataByType[type] = allStatusData.filter(d => d.abnormalStatus === type);
	});

	// 状態異常のリスト（ハードコードされているが、必要なら動的に取得しても良い）
	const abnormalStatusList = [
		"くらくら", "どく", "すやすや", "くたくた", "ひやひや", "ズキンズキン",
		"からげんき", "ぼんやりうっかり", "しょんぼりきぶん", "びりびり",
		"ちぐはぐリズム", "ロストフラッグ", "ばてばてヒリヒリ", "あせあせ",
		"全ての状態異常に関連した能力", "ルンルンきぶん", "はねかえし",
		"はねかえしむし", "毎ターンMP減少", "かばう", "ためこみ上手",
		"コチョコチョマスター", "いかく", "かくれみ"
	];

	// クライアントに渡すデータ（状態異常タイプごとのデータ）
	const statusTypeDataForClient: Record<string, AbnormalStatusWithFriend[]> = {};
	// ツリー表示用のカテゴリデータ
	const abnormalStatusCategories: TreeItemData[] = [];

	abnormalStatusList.forEach(statusType => {
		const currentStatusData = groupedDataByType[statusType] || [];
		if (currentStatusData.length === 0) {
			return; // データがない場合はスキップ
		}

		// デフォルトソート（属性順）を適用してクライアントに渡すデータを作成
		statusTypeDataForClient[statusType] = sortByAttribute(currentStatusData);

		// フレンズとフォトのデータを分離
		const friendsData = currentStatusData.filter(item => !item.isPhoto);
		const photoData = currentStatusData.filter(item => item.isPhoto);

		// フレンズの子カテゴリを構築（ここで statusTypeDataForClient が更新される）
		const friendsChildren = buildSubCategories(statusType, friendsData, 'friends', statusTypeDataForClient);
		// フォトの子カテゴリを構築（ここで statusTypeDataForClient が更新される）
		const photoChildren = buildSubCategories(statusType, photoData, 'photo', statusTypeDataForClient);

		const categoryChildren: TreeItemData[] = [];
		if (friendsChildren.length > 0) {
			categoryChildren.push({
				name: "フレンズ",
				id: `${statusType}-friends`, // より明確なID
				children: friendsChildren,
				isExpandedByDefault: true // デフォルトで展開
			});
		}
		if (photoChildren.length > 0) {
			categoryChildren.push({
				name: "フォト",
				id: `${statusType}-photo`, // より明確なID
				children: photoChildren,
				isExpandedByDefault: true // デフォルトで展開
			});
		}

		// 子カテゴリが存在する場合のみ、メインカテゴリを追加
		if (categoryChildren.length > 0) {
			abnormalStatusCategories.push({
				name: statusType,
				id: statusType,
				children: categoryChildren,
				isExpandedByDefault: false // メインカテゴリはデフォルトで閉じている
			});
		}
	});

	return (
		<div className="min-h-screen">
			<PageTitle title="状態異常スキル一覧" />

			<p className="p-1">
				フレンズとフォトの状態異常付与や耐性増加スキルの一覧です。<br />
				<span className="font-bold">
					状態異常の内容の説明は
					<SeesaaWikiLink
						href="https://seesaawiki.jp/kemono_friends3_5ch/d/%BE%F5%C2%D6%B0%DB%BE%EF"
					>
						こちら
					</SeesaaWikiLink>
					を参照してください。
				</span>
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
				statusTypes={abnormalStatusCategories.map(cat => cat.id)} // カテゴリIDのリストを渡す
				statusTypeData={statusTypeDataForClient}
				abnormalStatusCategories={abnormalStatusCategories}
			/>
		</div>
	);
}