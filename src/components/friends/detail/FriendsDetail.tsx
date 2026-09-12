import { FriendsDataRow } from "@/types/friends";
import { DetailSection } from "./DetailParts";
import { FriendsBasicInfo } from "./FriendsBasicInfo";
import { FriendsOrderFlags } from "./FriendsOrderFlags";
import { FriendsSkillCard } from "./FriendsSkillCard";
import { FriendsStatusSection } from "./FriendsStatusSection.client";
import { FriendsTextSection } from "./FriendsTextSection";
import { FriendsWildPhoto } from "./FriendsWildPhoto";

// 空のスキル(技名も効果も未入力)はカード自体を表示しない
function hasSkillContent(name: string, effect: string): boolean {
	return name.trim() !== "" || effect.trim() !== "";
}

export function FriendsDetail({ friend }: { friend: FriendsDataRow }) {
	const showKiseki = hasSkillContent(friend.kisekitraitName, friend.kisekitraitEffect);
	const showNanairo = hasSkillContent(friend.nanairoSkillName, friend.nanairoSkillEffect);

	return (
		<div>
			<FriendsBasicInfo friend={friend} />
			<FriendsStatusSection friend={friend} />
			<DetailSection title="スキル" id="skill">
				<div className="grid gap-3">
					<FriendsSkillCard
						title="けものミラクル"
						id="skill-miracle"
						name={friend.miracleName}
						effect=""
						showEffect={false}
						entries={[
							{ label: "必要MP", text: friend.miracleRequiredMp?.toString() || "-" },
							{ label: "Lv.1", text: friend.miracleEffectLv1 },
							{ label: "Lv.5", text: friend.miracleEffectLv5 },
							{ label: "けものミラクル＋", text: friend.miraclePlus },
						]}
					/>
					<div className="grid gap-3 md:grid-cols-2">
						<FriendsSkillCard
							title="とくいわざ"
							id="skill-special"
							name={friend.specialMoveName}
							effect={friend.specialMoveEffect}
						/>
						<FriendsSkillCard
							title="たいきスキル"
							id="skill-wait"
							name={friend.waitSkillName}
							effect={friend.waitSkillEffect}
							entries={[
								{ label: "発動率", text: friend.waitSkillActivationRate },
								{ label: "発動回数", text: friend.waitSkillActivationCount },
							]}
						/>
						<FriendsSkillCard
							title="とくせい"
							id="skill-trait"
							name={friend.traitName}
							effect={friend.traitEffect}
						/>
						{showKiseki && (
							<FriendsSkillCard
								title="キセキとくせい"
								id="skill-kiseki"
								name={friend.kisekitraitName}
								effect={friend.kisekitraitEffect}
							/>
						)}
						{showNanairo && (
							<FriendsSkillCard
								title="なないろとくせい"
								id="skill-nanairo"
								name={friend.nanairoSkillName}
								effect={friend.nanairoSkillEffect}
							/>
						)}
					</div>
				</div>
			</DetailSection>
			<FriendsOrderFlags friend={friend} />
			<FriendsTextSection
				introductionText={friend.introductionText}
				zukanText={friend.zukanText}
			/>
			<FriendsWildPhoto friend={friend} />
		</div>
	);
}
