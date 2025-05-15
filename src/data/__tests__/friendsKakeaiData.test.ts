import { getFriendsKakeaiData } from "@/data/friendsKakeaiData";
import { describe, test, expect, beforeAll } from "bun:test";

describe('getFriendsKakeaiData', () => {
	let friendsKakeaiData: Awaited<ReturnType<typeof getFriendsKakeaiData>>;

	beforeAll(async () => {
		friendsKakeaiData = await getFriendsKakeaiData();
	});

	function testKakeaiLinks(source: string, targets: string[], toBe = true){
		targets.forEach(target => {
			test(`${source}と${target}の間に掛け合いがある`, async () => {
				expect(friendsKakeaiData?.links?.some(link => link.source === source && link.target === target)).toBe(toBe);
				expect(friendsKakeaiData?.links?.some(link => link.source === target && link.target === source)).toBe(toBe);
			});
		});
	}

	function testGroups(groups: string[][]){
		for (const group of groups){
			test(`${group.map(friend => friend).join(', ')}が同一グループに属している`, async () => {
				const groupIds = friendsKakeaiData?.nodes?.find(node => node.id === group[0])?.groups;
				if(!groupIds || groupIds.length === 0){
					throw new Error(`Group not found for ${group[0]}`);
				}

				const friends = group.map(friend => friendsKakeaiData?.nodes?.find(node => node.id === friend));
				if(friends.some(friend => !friend)){
					throw new Error(`Friend not found for ${group[0]}`);
				}

				const result = groupIds.some(id => {
					return friends.every(friend => friend?.groups.includes(id));
				});

				expect(result).toBe(true);
			});
		}
	}

	test('データが取得できる', async () => {
		expect(friendsKakeaiData).toBeDefined();
	});

	describe('ギンギツネの掛け合いリンク', async () => {
		testKakeaiLinks('ギンギツネ', ['キタキツネ', 'オイナリサマ', 'アカギツネ', 'ホワイトライオン', 'シロサイ', 'トキ', 'トムソンガゼル', 'サーバル', 'セーバル', 'カラカル', 'ソンサーバル']);
	});

	describe('二つ名持ちのリンク', async () => {
		describe('【大きな瞳の美人顔】サーバル', async () => {
			testKakeaiLinks('【大きな瞳の美人顔】サーバル', ['ツチブタ', 'ブラックサーバル']);
			testKakeaiLinks('【大きな瞳の美人顔】サーバル', ['ギンギツネ', 'トキ'], false);
		});

		describe('【青い瞳の迷い猫】マヌルネコ', async () => {
			testKakeaiLinks('【青い瞳の迷い猫】マヌルネコ', ['【ジっとできない湿地のハンター】ハシビロコウ']);
			testKakeaiLinks('【青い瞳の迷い猫】マヌルネコ', ['チベットスナギツネ'], false);
		});

		describe('【ジっとできない湿地のハンター】ハシビロコウ', async () => {
			testKakeaiLinks('【ジっとできない湿地のハンター】ハシビロコウ', ['【青い瞳の迷い猫】マヌルネコ']);
			testKakeaiLinks('【ジっとできない湿地のハンター】ハシビロコウ', ['ハクトウワシ', 'オオタカ'], false);
		});
	});

	describe('2人グループ', async () => {
		testGroups([
			['ガチャピン', 'ムック'],
			['ミミィサーバル', 'キティサーバル'],
			['火の鳥', 'ユニコ']
		]);
	});

	describe('3人グループ', async () => {
		testGroups([
			['ノドグロミツオシエ', 'クズリ', 'ラーテル'],
			['サラブレッドあおかげ', 'サラブレッドくりげ', 'サラブレッドしろげ'],
			['カマイタチ・転', 'カマイタチ・切', 'カマイタチ・治']
		]);
	});

	describe('不完全4人グループ', async () => {
		testGroups([
			['ヒグマ', 'キンシコウ', 'アイアイ', 'パンサーカメレオン'],
			['アライグマ', 'フェネック', 'サーバル？', 'ホワイトサーバル'],
			['カグヤコウモリ', 'ウサギコウモリ', 'テングコウモリ', 'シロヘラコウモリ'],
		]);
	});

	describe('不完全5人グループ', async () => {
		testGroups([
			['サバンナシマウマ', 'チャップマンシマウマ', 'ライオン', 'アミメキリン', 'アードウルフ'],
			['ブラックバック', 'オーストラリアデビル', 'タスマニアデビル', 'でびるさま', 'ライジュウ']
		]);
	});
});