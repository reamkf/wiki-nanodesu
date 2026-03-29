import { beforeAll, describe, expect, it } from "bun:test";
import { getAbnormalStatusWithFriendsAndPhotos } from "@/data/abnormalStatusData";

describe('getAbnormalStatusWithFriendsAndPhotos', () => {
	let abnormalStatusData: Awaited<ReturnType<typeof getAbnormalStatusWithFriendsAndPhotos>>;

	beforeAll(async () => {
		abnormalStatusData = await getAbnormalStatusWithFriendsAndPhotos();
	});

	it('けものミラクルの備考先頭に必要MP{値}改行を付与する', () => {
		const miracleStatus = abnormalStatusData.find(status =>
			!status.isPhoto &&
			status.skillType === 'けものミラクル' &&
			status.friendsDataRow?.miracleRequiredMp !== null
		);

		expect(miracleStatus).toBeDefined();

		const expectedHeader = `必要MP${miracleStatus?.friendsDataRow?.miracleRequiredMp}\n`;
		expect(miracleStatus?.note.startsWith(expectedHeader)).toBe(true);
	});

	it('対象外スキルの備考先頭には必要MPを付与しない', () => {
		const nonTargetStatus = abnormalStatusData.find(status =>
			!status.isPhoto &&
			status.skillType !== 'けものミラクル' &&
			status.abnormalStatus !== 'MP増加' &&
			status.abnormalStatus !== '毎ターンMP増加' &&
			status.note !== ''
		);

		expect(nonTargetStatus).toBeDefined();
		expect(nonTargetStatus?.note.startsWith('必要MP')).toBe(false);
	});
});
