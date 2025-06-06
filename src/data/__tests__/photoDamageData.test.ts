import { getPhotoDamageData, getPhotoDamageDataByPhotoId, getPhotoDamageDataByPhotoIdAndState } from "@/data/photoDamageData";
import { describe, it, expect, beforeAll } from "bun:test";

describe('getPhotoDamageData', () => {
	let photoDamageData: Awaited<ReturnType<typeof getPhotoDamageData>>;

	beforeAll(async () => {
		photoDamageData = await getPhotoDamageData();
	});

	it('フォト火力データが取得できる', () => {
		expect(photoDamageData).toBeDefined();
		expect(Array.isArray(photoDamageData)).toBe(true);
		expect(photoDamageData.length).toBeGreaterThan(0);
	});

	describe('JHR・パン食い競争の部のデータ', () => {
		let samplePhotoDamageData: Awaited<ReturnType<typeof getPhotoDamageData>>[number] | undefined;

		beforeAll(() => {
			samplePhotoDamageData = photoDamageData.find(
				data => data.photoId === 'JHR・パン食い競争の部' &&
				data.changeState === '変化前'
			);
		});

		it('フォトIDがJHR・パン食い競争の部である', () => {
			expect(samplePhotoDamageData?.photoId).toBe('JHR・パン食い競争の部');
		});

		it('変化状態が変化前である', () => {
			expect(samplePhotoDamageData?.changeState).toBe('変化前');
		});

		it('条件がHP80%以上\nBeatである', () => {
			expect(samplePhotoDamageData?.condition).toBe('HP80%以上\nBeat');
		});

		it('与ダメ増加が1.07である', () => {
			expect(samplePhotoDamageData?.damageMultiplier).toBe(1.07);
		});
	});

	describe('あなたにあげるわのデータ', () => {
		let samplePhotoDamageDataPre: Awaited<ReturnType<typeof getPhotoDamageData>>[number] | undefined;
		let samplePhotoDamageDataPost: Awaited<ReturnType<typeof getPhotoDamageData>>[number] | undefined;

		beforeAll(() => {
			samplePhotoDamageDataPre = photoDamageData.find(
				data => data.photoId === 'あなたにあげるわ' &&
				data.changeState === '変化前'
			);
			samplePhotoDamageDataPost = photoDamageData.find(
				data => data.photoId === 'あなたにあげるわ' &&
				data.changeState === '変化後'
			);
		});

		describe('変化前', () => {
			it('フォトIDがあなたにあげるわである', () => {
				expect(samplePhotoDamageDataPre?.photoId).toBe('あなたにあげるわ');
			});

			it('変化状態が変化前である', () => {
				expect(samplePhotoDamageDataPre?.changeState).toBe('変化前');
			});

			it('条件が空である', () => {
				expect(samplePhotoDamageDataPre?.condition).toBe('');
			});

			it('与ダメ増加が1.07である', () => {
				expect(samplePhotoDamageDataPre?.damageMultiplier).toBe(1.07);
			});
		});

		describe('変化後', () => {
			it('フォトIDがあなたにあげるわである', () => {
				expect(samplePhotoDamageDataPost?.photoId).toBe('あなたにあげるわ');
			});

			it('変化状態が変化後である', () => {
				expect(samplePhotoDamageDataPost?.changeState).toBe('変化後');
			});

			it('条件が空である', () => {
				expect(samplePhotoDamageDataPost?.condition).toBe('');
			});

			it('与ダメ増加が1.09である', () => {
				expect(samplePhotoDamageDataPost?.damageMultiplier).toBe(1.09);
			});
		});
	});

	describe('複数条件があるフォトのデータ', () => {
		describe('かけっこインターバル', () => {
			let unconditionalData: Awaited<ReturnType<typeof getPhotoDamageData>>[number] | undefined;
			let conditionalData: Awaited<ReturnType<typeof getPhotoDamageData>>[number] | undefined;

			beforeAll(() => {
				const kakekoData = photoDamageData.filter(
					data => data.photoId === 'かけっこインターバル' &&
					data.changeState === '変化前'
				);
				unconditionalData = kakekoData.find(data => data.condition === '');
				conditionalData = kakekoData.find(data => data.condition !== '');
			});

			it('条件なしのデータが存在する', () => {
				expect(unconditionalData).toBeDefined();
				expect(unconditionalData?.photoId).toBe('かけっこインターバル');
				expect(unconditionalData?.changeState).toBe('変化前');
				expect(unconditionalData?.condition).toBe('');
				expect(unconditionalData?.damageMultiplier).toBe(1.05);
			});

			it('条件付きのデータが存在する', () => {
				expect(conditionalData).toBeDefined();
				expect(conditionalData?.photoId).toBe('かけっこインターバル');
				expect(conditionalData?.changeState).toBe('変化前');
				expect(conditionalData?.condition).toBe('HP50%以下\nTry');
				expect(conditionalData?.damageMultiplier).toBeCloseTo(1.1235, 4);
			});
		});
	});
});

describe('getPhotoDamageDataByPhotoId', () => {
	it('指定されたフォトIDのデータのみが取得できる', async () => {
		const jhrData = await getPhotoDamageDataByPhotoId('JHR・パン食い競争の部');

		expect(jhrData).toBeDefined();
		expect(Array.isArray(jhrData)).toBe(true);
		expect(jhrData.length).toBe(2);

		jhrData.forEach(data => {
			expect(data.photoId).toBe('JHR・パン食い競争の部');
		});
	});

	it('存在しないフォトIDでは空配列が返される', async () => {
		const nonExistentData = await getPhotoDamageDataByPhotoId('存在しないフォト');

		expect(nonExistentData).toBeDefined();
		expect(Array.isArray(nonExistentData)).toBe(true);
		expect(nonExistentData.length).toBe(0);
	});
});

describe('getPhotoDamageDataByPhotoIdAndState', () => {
	it('指定されたフォトIDと変化状態のデータのみが取得できる', async () => {
		const anataData = await getPhotoDamageDataByPhotoIdAndState('あなたにあげるわ', '変化前');

		expect(anataData).toBeDefined();
		expect(Array.isArray(anataData)).toBe(true);
		expect(anataData.length).toBe(1);
		expect(anataData[0].photoId).toBe('あなたにあげるわ');
		expect(anataData[0].changeState).toBe('変化前');
		expect(anataData[0].damageMultiplier).toBe(1.07);
	});

	it('複数条件があるフォトでも正しくフィルタリングされる', async () => {
		const kakekoData = await getPhotoDamageDataByPhotoIdAndState('かけっこインターバル', '変化前');

		expect(kakekoData).toBeDefined();
		expect(Array.isArray(kakekoData)).toBe(true);
		expect(kakekoData.length).toBe(2);

		kakekoData.forEach(data => {
			expect(data.photoId).toBe('かけっこインターバル');
			expect(data.changeState).toBe('変化前');
		});
	});

	it('存在しないフォトIDと変化状態では空配列が返される', async () => {
		const nonExistentData = await getPhotoDamageDataByPhotoIdAndState('存在しないフォト', '変化前');

		expect(nonExistentData).toBeDefined();
		expect(Array.isArray(nonExistentData)).toBe(true);
		expect(nonExistentData.length).toBe(0);
	});
});