import { PageTitle } from "@/components/PageTitle";
import { FriendsDataRow } from "@/types/friends";
import { FriendsBasicInfo } from "./FriendsBasicInfo";
import { FriendsOrderFlags } from "./FriendsOrderFlags";
import { FriendsSkillSection } from "./FriendsSkillSection";
import { FriendsStatusSection } from "./FriendsStatusSection.client";
import { FriendsTextSection } from "./FriendsTextSection";
import { FriendsWildPhoto } from "./FriendsWildPhoto";

export function FriendsDetail({ friend }: { friend: FriendsDataRow }) {
	const title = friend.secondName ? `${friend.secondName} ${friend.name}` : friend.name;

	return (
		<div>
			<PageTitle title={title} />
			<FriendsBasicInfo friend={friend} />
			<FriendsStatusSection friend={friend} />
			<FriendsOrderFlags friend={friend} />
			<FriendsSkillSection
				title="けものミラクル"
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
			<FriendsSkillSection
				title="とくいわざ"
				name={friend.specialMoveName}
				effect={friend.specialMoveEffect}
			/>
			<FriendsSkillSection
				title="たいきスキル"
				name={friend.waitSkillName}
				effect={friend.waitSkillEffect}
				entries={[
					{ label: "発動率", text: friend.waitSkillActivationRate },
					{ label: "発動回数", text: friend.waitSkillActivationCount },
				]}
			/>
			<FriendsSkillSection
				title="とくせい"
				name={friend.traitName}
				effect={friend.traitEffect}
			/>
			<FriendsSkillSection
				title="キセキとくせい"
				name={friend.kisekitraitName}
				effect={friend.kisekitraitEffect}
			/>
			<FriendsSkillSection
				title="なないろとくせい"
				name={friend.nanairoSkillName}
				effect={friend.nanairoSkillEffect}
			/>
			<FriendsTextSection
				introductionText={friend.introductionText}
				zukanText={friend.zukanText}
			/>
			<FriendsWildPhoto friend={friend} />
		</div>
	);
}
