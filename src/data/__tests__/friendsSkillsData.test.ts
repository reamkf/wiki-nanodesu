import { beforeAll, describe, expect, it } from "bun:test";
import { getSkillsWithFriendsData } from "@/data/friendsSkillsData";

describe('getSkillsWithFriendsData', () => {
	let skillsData: Awaited<ReturnType<typeof getSkillsWithFriendsData>>;

	beforeAll(async () => {
		skillsData = await getSkillsWithFriendsData();
	});

	it('けものミラクルの備考先頭に必要MP{値}改行を付与する', () => {
		const miracleSkill = skillsData.find(skill => skill.skillType === 'けものミラクル');
		expect(miracleSkill).toBeDefined();
		expect(miracleSkill?.friendsDataRow.miracleRequiredMp).not.toBeNull();

		const expectedHeader = `必要MP${miracleSkill?.friendsDataRow.miracleRequiredMp}\n`;
		expect(miracleSkill?.note.startsWith(expectedHeader)).toBe(true);
	});

	it('MP増加系スキルの備考先頭に必要MP{値}改行を付与する', () => {
		const mpIncreaseSkill = skillsData.find(skill =>
			(skill.effectType === 'MP増加' || skill.effectType === '毎ターンMP増加') && skill.skillType !== 'けものミラクル'
		);

		expect(mpIncreaseSkill).toBeDefined();
		expect(mpIncreaseSkill?.friendsDataRow.miracleRequiredMp).not.toBeNull();

		const expectedHeader = `必要MP${mpIncreaseSkill?.friendsDataRow.miracleRequiredMp}\n`;
		expect(mpIncreaseSkill?.note.startsWith(expectedHeader)).toBe(true);
	});

	it('対象外スキルの備考先頭には必要MPを付与しない', () => {
		const nonTargetSkill = skillsData.find(skill =>
			skill.skillType !== 'けものミラクル' &&
			skill.effectType !== 'MP増加' &&
			skill.effectType !== '毎ターンMP増加' &&
			skill.note !== ''
		);

		expect(nonTargetSkill).toBeDefined();
		expect(nonTargetSkill?.note.startsWith('必要MP')).toBe(false);
	});
});
