import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";

interface SkillEntry {
	label: string;
	text: string;
}

interface FriendsSkillSectionProps {
	title: string;
	name: string;
	effect: string;
	entries?: SkillEntry[];
	showEffect?: boolean;
}

function renderText(text: string): React.ReactNode {
	return text ? parseSeesaaWikiText(text) : "-";
}

export function FriendsSkillSection({
	title,
	name,
	effect,
	entries = [],
	showEffect = true,
}: FriendsSkillSectionProps) {
	return (
		<section className="mb-6">
			<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">{title}</h2>
			<div className="grid max-w-4xl gap-3 rounded border border-gray-200 p-3 text-sm">
				<div>
					<p className="font-semibold text-gray-600">技名</p>
					<p className="text-base font-bold">{name || "-"}</p>
				</div>
				{showEffect && (
					<div>
						<p className="font-semibold text-gray-600">効果</p>
						<p>{renderText(effect)}</p>
					</div>
				)}
				{entries.map((entry) => (
					<div key={entry.label}>
						<p className="font-semibold text-gray-600">{entry.label}</p>
						<p>{renderText(entry.text)}</p>
					</div>
				))}
			</div>
		</section>
	);
}
