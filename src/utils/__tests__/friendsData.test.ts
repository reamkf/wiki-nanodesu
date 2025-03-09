import { getFriendsData } from "../friends/friendsData";
import { describe, it, expect, beforeAll } from "bun:test";
import { FriendsAttribute, MegumiPattern } from "@/types/friends";

describe('getFriendsData', () => {
	let friendsData: Awaited<ReturnType<typeof getFriendsData>>;

	beforeAll(async () => {
		friendsData = await getFriendsData();
	});

	it('フレンズデータが取得できる', async () => {
		await expect(friendsData).toBeDefined();
	});

	describe('カマイタチ・切のデータ', () => {
		let sampleFriendsData: Awaited<ReturnType<typeof getFriendsData>>[number] | undefined;

		beforeAll(() => {
			sampleFriendsData = friendsData.find(friend => friend.id === 'カマイタチ・切');
		});

		describe('基本情報', () => {
			it('idがカマイタチ・切である', () => {
				expect(sampleFriendsData?.id).toBe('カマイタチ・切');
			});

			it('フレンズ名がカマイタチ・切である', () => {
				expect(sampleFriendsData?.name).toBe('カマイタチ・切');
			});

			it('属性がマイペースである', () => {
				expect(sampleFriendsData?.attribute).toBe(FriendsAttribute.mypace);
			});

			it('初期けも級が4である', () => {
				expect(sampleFriendsData?.rarity).toBe(4);
			});

			it('野生大解放がtrueである', () => {
				expect(sampleFriendsData?.hasYasei5).toBe(true);
			});

			it('12ポケがfalseである', () => {
				expect(sampleFriendsData?.has12poke).toBe(false);
			});
		});

		describe('登録ステータス', () => {
			it('かいひが1.0%である', () => {
				expect(sampleFriendsData?.status.avoid).toBe(0.01);
			});

			if(sampleFriendsData?.hasYasei5) {
				it('野生5のかいひが1.2%である', () => {
					expect(sampleFriendsData?.status.avoidYasei5).toBe(0.012);
				});
			}

			it('初期ステータスが正しい', () => {
				expect(sampleFriendsData?.status.statusInitial).toEqual({
					kemosute: 45535,
					hp: 17307,
					atk: 7999,
					def: 3846,
					estimated: false
				});
			});

			it('Lv90のステータスが正しい', () => {
				expect(sampleFriendsData?.status.status90).toEqual({
					kemosute: 53049,
					hp: 20162,
					atk: 9319,
					def: 4481,
					estimated: false
				});
			});

			it('Lv99のステータスが正しい', () => {
				expect(sampleFriendsData?.status.status99).toEqual({
					kemosute: 56067,
					hp: 21310,
					atk: 9849,
					def: 4736,
					estimated: false
				});
			});

			it('Lv99野生5のステータスが正しい', () => {
				expect(sampleFriendsData?.status.status99Yasei5).toEqual({
					kemosute: 61601,
					hp: 23414,
					atk: 10821,
					def: 5203,
					estimated: false
				});
			});
		});

		describe('ステータス基礎値', () => {
			it('Lv1基礎値が正しい', () => {
				expect(sampleFriendsData?.status.statusBase.lv1).toEqual({
					kemosute: null,
					hp: 2227,
					atk: 1029,
					def: 495,
					estimated: true
				});
			});

			it('Lv90基礎値が正しい', () => {
				expect(sampleFriendsData?.status.statusBase.lv90).toEqual({
					kemosute: null,
					hp: 11132,
					atk: 5143,
					def: 2472,
					estimated: true
				});
			});

			it('Lv99基礎値が正しい', () => {
				expect(sampleFriendsData?.status.statusBase.lv99).toEqual({
					kemosute: null,
					hp: 12175,
					atk: 5625,
					def: 2704,
					estimated: true
				});
			});

			it('野生解放4基礎値が正しい', () => {
				expect(sampleFriendsData?.status.statusBase.yasei4).toEqual({
					kemosute: null,
					hp: 7197,
					atk: 3328,
					def: 1601,
					estimated: true
				});
			});

			it('野生解放5基礎値が正しい', () => {
				expect(sampleFriendsData?.status.statusBase.yasei5).toEqual({
					kemosute: null,
					hp: 9110,
					atk: 4212,
					def: 2026,
					estimated: true
				});
			});

			it('めぐみパターンが正しい', () => {
				expect(sampleFriendsData?.status.statusBase.megumiPattern).toBe(MegumiPattern.atk50);
			});
		});
	});
});
