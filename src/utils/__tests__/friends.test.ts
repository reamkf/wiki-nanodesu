import { describe, expect, it } from 'bun:test';
import { calculateFriendsStatus } from '../friends';
import { FriendsAttribute, FriendsDataRow, MegumiPattern } from '@/types/friends';
import { BasicStatus } from '@/types/common';

describe('calculateFriendsStatus', () => {
	const nullStatus: BasicStatus = {
		hp: null,
		atk: null,
		def: null
	};

	const isStatusNull = (status: BasicStatus): boolean => {
		return status.hp === null && status.atk === null && status.def === null;
	};

	// テストデータの作成
	const createTestFriendsData = (
		rarity: number = 1,
		megumiPattern: MegumiPattern = MegumiPattern.balanced,
		statusBase: {
			lv1?: BasicStatus,
			lv90?: BasicStatus,
			lv99?: BasicStatus,
			yasei4?: BasicStatus,
			yasei5?: BasicStatus,
		} = {}
	): FriendsDataRow => {

		return {
			id: 'test',
			name: 'テストフレンズ',
			secondName: '',
			attribute: FriendsAttribute.friendry,
			implementDate: '',
			implementType: '',
			implementTypeDetail: '',
			listIndex: 0,
			iconUrl: '',
			rarity,
			hasYasei5: false,
			has12poke: false,
			numOfClothes: 0,
			cv: '',
			status: {
				avoid: null,
				avoidYasei5: null,
				plasm: null,
				beatFlags: null,
				actionFlags: null,
				tryFlags: null,
				flagDamageUp: {
					beat: null,
					action: null,
					try: null
				},
				flagDamageUpYasei5: {
					beat: null,
					action: null,
					try: null
				},
				statusInitial: nullStatus,
				status90: nullStatus,
				status99: nullStatus,
				status90Yasei5: nullStatus,
				status99Yasei5: nullStatus,
				status150: nullStatus,
				status150Yasei5: nullStatus,
				status200: nullStatus,
				status200Yasei5: nullStatus,
				statusBase: {
					lv1: statusBase.lv1 || nullStatus,
					lv90: statusBase.lv90 || nullStatus,
					lv99: statusBase.lv99 || nullStatus,
					yasei4: statusBase.yasei4 || nullStatus,
					yasei5: statusBase.yasei5 || nullStatus,
					megumiPattern
				}
			}
		};
	};

	// Lv100以上のステータス計算
	describe('Lv100以上のステータス計算', () => {
		it('Lv100以上のステータスを計算できる（☆1）', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv99: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 100, 1, 0);
			expect(status).toEqual({
				hp: 1020,
				atk: 1035,
				def: 1035,
				estimated: true
			});
		});

		it('Lv100以上のステータスを計算できる（☆6）', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.atk65, {
				lv99: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 100, 6, 0);
			expect(status).toEqual({
				hp: 1110,
				atk: 1165,
				def: 1110,
				estimated: true
			});
		});

		it('Lv99ステータスが不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv99: nullStatus
			});

			const status = calculateFriendsStatus(friendsData, 100, 4, 0);
			expect(isStatusNull(status)).toBe(true)
		});

		it('めぐみパターンが不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.unknown, {
				lv99: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 100, 1, 0);
			expect(isStatusNull(status)).toBe(true)
		});
	});

	// 初期ステータス
	describe('初期ステータス', () => {
		it('初期ステータスを返す（☆1）', () => {
			const initialStatus = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.statusInitial = initialStatus;
			friendsData.rarity = 1;
			const initialLv = friendsData.rarity * 10 + 3;

			const status = calculateFriendsStatus(friendsData, initialLv, friendsData.rarity, 4);
			expect(status).toEqual(initialStatus);
		});

		it('初期ステータスを返す（☆2）', () => {
			const initialStatus = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.statusInitial = initialStatus;
			friendsData.rarity = 2;
			const initialLv = friendsData.rarity * 10 + 3;

			const status = calculateFriendsStatus(friendsData, initialLv, friendsData.rarity, 4);
			expect(status).toEqual(initialStatus);
		});

		it('初期ステータスを返す（☆3）', () => {
			const initialStatus = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.statusInitial = initialStatus;
			friendsData.rarity = 3;
			const initialLv = friendsData.rarity * 10 + 3;

			const status = calculateFriendsStatus(friendsData, initialLv, friendsData.rarity, 4);
			expect(status).toEqual(initialStatus);
		});

		it('初期ステータスを返す（☆4）', () => {
			const initialStatus = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.statusInitial = initialStatus;
			friendsData.rarity = 4;
			const initialLv = friendsData.rarity * 10 + 3;

			const status = calculateFriendsStatus(friendsData, initialLv, friendsData.rarity, 4);
			expect(status).toEqual(initialStatus);
		});
	});

	// Lv90のステータス計算
	describe('Lv90のステータス計算', () => {
		it('野生解放4のLv90ステータスを返す（計算なし）', () => {
			const status90 = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.status90 = status90;

			const status = calculateFriendsStatus(friendsData, 90, 1, 4);
			expect(status).toEqual(status90);
		});

		it('野生解放5のLv90ステータスを返す（計算なし）', () => {
			const status90Yasei5 = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.status90Yasei5 = status90Yasei5;

			const status = calculateFriendsStatus(friendsData, 90, 1, 5);
			expect(status).toEqual(status90Yasei5);
		});

		it('野生解放なしのLv90ステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 90, 1, 0);
			expect(status).toEqual({
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: true
			});
		});

		it('Lv90基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: nullStatus,
				yasei4: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 90, 1, 0);
			expect(isStatusNull(status)).toBe(true);
		});

		it('野生解放4基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				},
				yasei4: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 90, 1, 4);
			expect(isStatusNull(status)).toBe(true);
		});

		it('野生解放5基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				},
				yasei5: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 90, 1, 5);
			expect(isStatusNull(status)).toBe(true);
		});
	});

	// Lv99のステータス計算
	describe('Lv99のステータス計算', () => {
		it('野生解放4のLv99ステータスを返す（計算なし）', () => {
			const status99 = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.status99 = status99;

			const status = calculateFriendsStatus(friendsData, 99, 1, 4);
			expect(status).toEqual(status99);
		});

		it('野生解放5のLv99ステータスを返す（計算なし）', () => {
			const status99Yasei5 = {
				hp: 1000,
				atk: 1000,
				def: 1000,
				estimated: false
			};
			const friendsData = createTestFriendsData(1);
			friendsData.status.status99Yasei5 = status99Yasei5;

			const status = calculateFriendsStatus(friendsData, 99, 1, 5);
			expect(status).toEqual(status99Yasei5);
		});

		it('野生解放なしのLv99ステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv99: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 99, 3, 0);
			expect(status).toEqual({
				hp: 1040,
				atk: 1040,
				def: 1040,
				estimated: true
			});
		});

		it('Lv99基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv99: nullStatus,
				yasei4: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 99, 1, 0);
			expect(isStatusNull(status)).toBe(true);
		});

		it('野生解放4基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv99: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				},
				yasei4: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 99, 1, 4);
			expect(isStatusNull(status)).toBe(true);
		});

		it('野生解放5基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv99: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				},
				yasei5: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 99, 1, 5);
			expect(isStatusNull(status)).toBe(true);
		});
	});

	// Lv1のステータス計算
	describe('Lv1のステータス計算', () => {
		it('Lv1のステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: {
					hp: 10,
					atk: 20,
					def: 30,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 1, 1, 0);
			expect(status).toEqual({
				hp: 10,
				atk: 20,
				def: 30,
				estimated: true
			});
		});

		it('Lv1の☆4ステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: {
					hp: 10,
					atk: 20,
					def: 30,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 1, 4, 0);
			expect(status).toEqual({
				hp: 11,
				atk: 22,
				def: 32,
				estimated: true
			});
		});

		it('Lv1基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 1, 1, 0);
			expect(isStatusNull(status)).toBe(true);
		});
	});

	// Lv2-89のステータス計算
	describe('Lv2-89のステータス計算', () => {
		it('Lv2-89のステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: {
					hp: 100,
					atk: 100,
					def: 100,
					estimated: false
				},
				lv90: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 45, 1, 0);
			expect(status).toEqual({
				hp: 544,
				atk: 544,
				def: 544,
				estimated: true
			});
		});

		it('けも級補正を適用する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: {
					hp: 100,
					atk: 100,
					def: 100,
					estimated: false
				},
				lv90: {
					hp: 1000,
					atk: 1000,
					def: 1000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 45, 3, 0);
			expect(status).toEqual({
				hp: 566,
				atk: 566,
				def: 566,
				estimated: true
			});
		});

		it('野生解放4のLv2-89の☆6ステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: {
					hp: 100,
					atk: 200,
					def: 300,
					estimated: false
				},
				lv90: {
					hp: 1000,
					atk: 2000,
					def: 30000,
					estimated: false
				},
				yasei4: {
					hp: 300,
					atk: 3000,
					def: 12345,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 45, 6, 4);
			expect(status).toEqual({
				hp: 929,
				atk: 4498,
				def: 30061,
				estimated: true
			});
		});

		it('Lv1基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: nullStatus,
				lv90: {
					hp: 1000,
					atk: 2000,
					def: 3000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 45, 6, 4);
			expect(isStatusNull(status)).toBe(true);
		});

		it('Lv90基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv1: {
					hp: 100,
					atk: 100,
					def: 100,
					estimated: false
				},
				lv90: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 45, 6, 4);
			expect(isStatusNull(status)).toBe(true);
		});
	});

	describe('Lv91-98のステータス計算', () => {
		it('Lv91-98のステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 1000,
					atk: 2000,
					def: 3000,
					estimated: false
				},
				lv99: {
					hp: 40000,
					atk: 50000,
					def: 60000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 95, 1, 0);
			expect(status).toEqual({
				hp: 22666,
				atk: 28666,
				def: 34666,
				estimated: true
			});
		});

		it('けも級補正を適用する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 1000,
					atk: 2000,
					def: 3000,
					estimated: false
				},
				lv99: {
					hp: 40000,
					atk: 50000,
					def: 60000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 95, 3, 0);
			expect(status).toEqual({
				hp: 23573,
				atk: 29813,
				def: 36053,
				estimated: true
			});
		});

		it('野生解放4のLv2-89の☆6ステータスを計算する', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 100,
					atk: 200,
					def: 300,
					estimated: false
				},
				lv99: {
					hp: 1000,
					atk: 2000,
					def: 30000,
					estimated: false
				},
				yasei4: {
					hp: 300,
					atk: 4620,
					def: 12345,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 95, 6, 4);
			expect(status).toEqual({
				hp: 991,
				atk: 6403,
				def: 32060,
				estimated: true
			});
		});

		it('Lv90基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: nullStatus,
				lv99: {
					hp: 40000,
					atk: 50000,
					def: 60000,
					estimated: false
				}
			});

			const status = calculateFriendsStatus(friendsData, 95, 6, 4);
			expect(isStatusNull(status)).toBe(true);
		});

		it('Lv99基礎値が不明な場合はnullを返す', () => {
			const friendsData = createTestFriendsData(1, MegumiPattern.balanced, {
				lv90: {
					hp: 100,
					atk: 200,
					def: 300,
					estimated: false
				},
				lv99: nullStatus,
			});

			const status = calculateFriendsStatus(friendsData, 95, 6, 4);
			expect(isStatusNull(status)).toBe(true);
		});
	});
});