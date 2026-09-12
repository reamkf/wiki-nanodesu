import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";
import { DetailCard, DetailField } from "./DetailParts";

interface SkillEntry {
	label: string;
	text: string;
}

interface FriendsSkillCardProps {
	title: string;
	id: string;
	name: string;
	effect: string;
	entries?: SkillEntry[];
	showEffect?: boolean;
}

function renderText(text: string): React.ReactNode {
	return text ? parseSeesaaWikiText(text) : "-";
}

// スキル1件分のカード(H3相当)。ページレベルのH2は呼び出し側のDetailSectionが担う
export function FriendsSkillCard({
	title,
	id,
	name,
	effect,
	entries = [],
	showEffect = true,
}: FriendsSkillCardProps) {
	return (
		<DetailCard title={title} id={id}>
			<div className="grid gap-3">
				<DetailField label="技名">
					<p className="text-base font-bold">{name || "-"}</p>
				</DetailField>
				{showEffect && <DetailField label="効果">{renderText(effect)}</DetailField>}
				{entries.map((entry) => (
					<DetailField key={entry.label} label={entry.label}>
						{renderText(entry.text)}
					</DetailField>
				))}
			</div>
		</DetailCard>
	);
}
