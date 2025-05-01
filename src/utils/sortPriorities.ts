import { FriendsOrPhotoSkillType } from '@/types/abnormalStatus'; // 必要に応じて型をインポート

// 威力のソート優先度マップ
export const POWER_PRIORITY_MAP: Record<string, number> = {
	'完全耐性': 1000,
	'大幅に': 500,
	'-': 100,
	'高': 90,
	'大': 85,
	'中': 49,
	'低': 25,
	'小': 20,
	'少し': 11,
	'少しだけ': 10,
	'ほんの少し': 9,
};

// 威力の優先度を取得する関数
export function getPowerPriority(power: string): number {
	if (!power) return -1;

	const match = /\((\d+(?:\.\d+)?)(%)?(超|未満)?\)/.exec(power);
	if(match){
		const powerNum = parseFloat(match[1]);
		// const isPercent = match[2] === '%';
		const adjust = match[3] === '超' ? 5 : match[3] === '未満' ? -5 : 0;
		if(!isNaN(powerNum)){
			return powerNum + adjust;
		}
	}

	const possiblePowers = Object.keys(POWER_PRIORITY_MAP);
	for(const possiblePower of possiblePowers){
		if(power.includes(possiblePower)){
			return POWER_PRIORITY_MAP[possiblePower];
		}
	}

	return 0;
}

// 発動率のソート優先度マップ
export const ACTIVATION_RATE_PRIORITY_MAP: Record<string, number> = {
	'-': 100,
	'高確率': 90,
	'中確率': 50,
	'低確率': 30
};

// 発動率の優先度を取得する関数
export function getActivationRatePriority(activationRate: string): number {
	if (!activationRate) return -1;

	// 数値+%の形式（例：100%、75%など）をチェック
	const percentMatch = /(\d+(\.\d+)?)(%)?/.exec(activationRate);
	if (percentMatch) {
		// 数値を抽出して、100を基準にソート（大きいほど優先度が高い）
		return parseFloat(percentMatch[1]);
	}

	const match = /(高|中|低)確率|(^-)|(-$)/.exec(activationRate);
	if(match){
		return ACTIVATION_RATE_PRIORITY_MAP[match[0]] || 0;
	}

	return 0;
}

// 発動回数の優先度を取得する関数
export function getActivationCountPriority(activationCount: string | number): number {
	if (!activationCount) return -1;

	if (typeof activationCount === 'string') {
		if(activationCount === "-" || activationCount === "∞") return Infinity;
		const parsed = parseInt(activationCount);
		if(!isNaN(parsed)){
			return parsed;
		}
	} else if(typeof activationCount === 'number'){
		return activationCount;
	}

	return -1;
}

// スキルタイプの優先度を取得する関数
// FriendsOrPhotoSkillType を使用するように変更
export function getSkillTypePriority(skillType: FriendsOrPhotoSkillType): number {
	if (!skillType) return -1;

	if (skillType === 'とくせい' || skillType === 'キセキとくせい' || skillType === 'なないろとくせい') return 3;

	if (skillType === 'とくせい(変化前・後)') return 3;
	if (skillType === 'とくせい(変化後)') return 2;
	if (skillType === 'とくせい(変化前)') return 1;

	// 他のフレンズスキルタイプ（けものミラクル、とくいわざ、たいきスキル）は優先度0とする

	return 0;
}

// 対象の優先度を取得する関数
export function getTargetPriority(target: string): number {
	if (!target) return -1;

	if ((target.includes('味方全体') && !target.includes('自身を除く')) || target.includes('相手全体')) return 3;
	if (target.includes('味方全体')) return 2;

	return 0;
}
