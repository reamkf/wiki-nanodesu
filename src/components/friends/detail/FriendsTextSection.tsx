import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";
import { DetailCard, DetailSection } from "./DetailParts";

function TextBlock({ title, id, text }: { title: string; id: string; text: string }) {
	return (
		<DetailCard title={title} id={id}>
			<div className="whitespace-pre-wrap text-sm text-gray-900">
				{text ? parseSeesaaWikiText(text) : "-"}
			</div>
		</DetailCard>
	);
}

export function FriendsTextSection({
	introductionText,
	zukanText,
	showTitle = true,
}: {
	introductionText: string;
	zukanText: string;
	showTitle?: boolean;
}) {
	const body = (
		<div className="grid gap-3 md:grid-cols-2">
			<TextBlock title="自己紹介" id="text-introduction" text={introductionText} />
			<TextBlock title="ずかん" id="text-zukan" text={zukanText} />
		</div>
	);

	// 比較ページでは見出しなしのカード群だけを使う
	if (!showTitle) {
		return body;
	}

	return (
		<DetailSection title="基本テキスト" id="text">
			{body}
		</DetailSection>
	);
}
