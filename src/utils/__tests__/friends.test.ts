import { describe, test, expect } from "bun:test";
import { isHc } from "../friends";
import { getFriendsData } from "../friendsData";

describe('isHc', async () => {
	const friendsData = await getFriendsData();

	describe('HCフレンズの判定', () => {
		test('【みんなでジャスティス】ハクトウワシはHCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'ハクトウワシ(緑)')!)).toBe(true);
		});

		test('【いいこと思いつきました】スナネコはHCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'スナネコ(赤)')!)).toBe(true);
		});

		test('【わたしを頼ってね！】アカギツネはHCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'アカギツネ(青)')!)).toBe(true);
		});

		test('【頼れる副隊長】ドールはHCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'ドール(黄緑)')!)).toBe(true);
		});

		test('【オシャレリーダー】チャップマンシマウマはHCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'チャップマンシマウマ(桃)')!)).toBe(true);
		});

		test('【ハツラツなつっこ！】バンドウイルカはHCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'バンドウイルカ(水)')!)).toBe(true);
		});
	});

	describe('非HCフレンズの判定', () => {
		test('ハクトウワシは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'ハクトウワシ')!)).toBe(false);
		});

		test('スナネコは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'スナネコ')!)).toBe(false);
		});

		test('アカギツネは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'アカギツネ')!)).toBe(false);
		});

		test('ドールは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'ドール')!)).toBe(false);
		});

		test('チャップマンシマウマは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'チャップマンシマウマ')!)).toBe(false);
		});

		test('バンドウイルカは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === 'バンドウイルカ')!)).toBe(false);
		})
	});

	describe('2つ名持ちだが非HCフレンズの判定', () => {
		test('【大きな瞳の美人顔】サーバルは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === '【大きな瞳の美人顔】サーバル')!)).toBe(false);
		});

		test('【ジっとできない湿地のハンター】ハシビロコウは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === '【ジっとできない湿地のハンター】ハシビロコウ')!)).toBe(false);
		});

		test('【青い瞳の迷い猫】マヌルネコは非HCである', () => {
			expect(isHc(friendsData.find(friend => friend.id === '【青い瞳の迷い猫】マヌルネコ')!)).toBe(false);
		});
	});
});
