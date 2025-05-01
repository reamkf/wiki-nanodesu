import { FriendsAttributeIconAndName } from '@/components/friends/FriendsAttributeIconAndName';
import { PhotoAttributeIconAndName } from '@/components/photo/PhotoAttributeIconAndName';
import { FriendsDataRow } from '@/types/friends';
import { PhotoDataRow } from '@/types/photo';
import { formatText } from './GenericDataTable';
import { isNumber, toPercent } from '@/utils/common';

// AttributeCell 用データ型
interface DataWithAttribute {
	isPhoto?: boolean;
	friendsDataRow?: Partial<Pick<FriendsDataRow, 'attribute'>> | null;
	photoDataRow?: Partial<Pick<PhotoDataRow, 'attribute'>> | null;
}

// ActivationRateCell 用データ型
interface DataWithActivationRate {
	activationRate?: string | number | null;
}

// CommonPowerCell 用データ型
interface DataWithPower {
	power?: string | number | null;
}

/**
 * フレンズまたはフォトの属性アイコンと名前を表示するセルコンポーネント
 */
export const AttributeCell = ({ data }: { data: DataWithAttribute }) => {
	if (data.isPhoto && data.photoDataRow?.attribute) {
		return <PhotoAttributeIconAndName attribute={data.photoDataRow.attribute} />;
	} else if (!data.isPhoto && data.friendsDataRow?.attribute) {
		return <FriendsAttributeIconAndName attribute={data.friendsDataRow.attribute} />;
	}
	return null;
};

/**
 * 発動率を表示するセルコンポーネント
 * 数値の場合はパーセント表示、文字列の場合はそのまま表示する
 */
export const ActivationRateCell = ({ data }: { data: DataWithActivationRate }) => {
	const activationRate = data.activationRate;
	if (activationRate == null) return null;

	const activationRateStr = String(activationRate);

	if (!isNumber(activationRateStr)) return formatText(activationRateStr);

	const activationRateNum = parseFloat(activationRateStr);
	return toPercent(activationRateNum);
};

/**
 * 威力 (Power) を表示する基本的なセルコンポーネント
 * 数値でない場合は文字列としてフォーマットし、数値の場合はそのまま表示する
 */
export const CommonPowerCell = ({ data }: { data: DataWithPower }) => {
	const power = data.power;
	if (power == null) return null;

	const powerStr = String(power);

	if (!isNumber(powerStr)) return formatText(powerStr);

	const powerNum = parseFloat(powerStr);
	return powerNum.toString();
};