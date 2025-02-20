import { getPhotoData } from "../photoData";
import { describe, it, expect, beforeAll } from "bun:test";
import { PhotoAttribute } from "@/types/photos";

describe('getPhotoData', () => {
	let photoData: Awaited<ReturnType<typeof getPhotoData>>;

	beforeAll(async () => {
		photoData = await getPhotoData();
	});

	it('フォトデータが取得できる', async () => {
		await expect(photoData).toBeDefined();
	});

	describe('てるてるのおまじないのデータ', () => {
		let samplePhotoData: Awaited<ReturnType<typeof getPhotoData>>[number] | undefined;

		beforeAll(() => {
			samplePhotoData = photoData.find(photo => photo.name === 'てるてるのおまじない');
		});

		describe('基本情報', () => {
			it('フォト名がてるてるのおまじないである', () => {
				expect(samplePhotoData?.name).toBe('てるてるのおまじない');
			});

			it('レア度が4である', () => {
				expect(samplePhotoData?.rarity).toBe(4);
			});

			it('属性が足跡である', () => {
				expect(samplePhotoData?.attribute).toBe(PhotoAttribute.footprint);
			});

			it('入手が限定~~課金パックである', () => {
				expect(samplePhotoData?.implementType).toBe('限定~~課金パック');
			});

			it('実装日が2024/06/20である', () => {
				expect(samplePhotoData?.implementDate).toBe('Thu Jun 20 2024 00:00:00 GMT+0900 (日本標準時)');
			});

			it('イラストレーター名が只野まぐである', () => {
				expect(samplePhotoData?.illustratorName).toBe('只野まぐ');
			});

			it('アイコンURLがhttps://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/b1uIfnXFkT.pngである', () => {
				expect(samplePhotoData?.iconUrl).toBe('https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/b1uIfnXFkT.png');
			});

			it('アイコンURL(変化後)がhttps://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/ynAIAP4pF4.pngである', () => {
				expect(samplePhotoData?.iconUrlChanged).toBe('https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/ynAIAP4pF4.png');
			});

			it('とくせいが正しい', () => {
				expect(samplePhotoData?.trait).toBe('自身の与ダメージが10%増加する');
			});

			it('とくせい(変化後)が正しい', () => {
				expect(samplePhotoData?.traitChanged).toBe('自身の与ダメージが10%増加し~~&color(red){くたくた、ひやひや、ズキンズキン、からげんき状態にならない}');
			});
		});

		describe('ステータス', () => {
			it('初期ステータスが正しい', () => {
				expect(samplePhotoData?.status.status1).toEqual({
					kemosute: null,
					hp: 100,
					atk: 505,
					def: 40,
					estimated: false
				});
			});

			it('変化前ステータスが正しい', () => {
				expect(samplePhotoData?.status.statusMedium).toEqual({
					kemosute: null,
					hp: 242,
					atk: 1222,
					def: 96,
					estimated: false
				});

			});

			it('変化後ステータスが正しい', () => {
				expect(samplePhotoData?.status.statusMax).toEqual({
					kemosute: null,
					hp: 300,
					atk: 1515,
					def: 120,
					estimated: false
				});
			});
		});
	});

	describe('属性のパース', () => {
		it('まよぴかの属性が足跡である', () => {
			const samplePhotoData = photoData.find(photo => photo.name === 'まよなかぴかぴか');
			expect(samplePhotoData?.attribute).toBe(PhotoAttribute.footprint);
		});

		it('オフショットの属性が青である', () => {
			const samplePhotoData = photoData.find(photo => photo.name === 'オフショット');
			expect(samplePhotoData?.attribute).toBe(PhotoAttribute.blue);
		});

		it('輝きの欠片フォト☆４の属性が無である', () => {
			const samplePhotoData = photoData.find(photo => photo.name === '輝きの欠片フォト☆４');
			expect(samplePhotoData?.attribute).toBe(PhotoAttribute.none);
		});
	});
})