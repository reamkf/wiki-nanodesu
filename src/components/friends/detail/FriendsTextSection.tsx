import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";

function TextBlock({ title, text }: { title: string; text: string }) {
	return (
		<article className="rounded border border-gray-200 p-3">
			<h3 className="mb-2 font-bold">{title}</h3>
			<div className="whitespace-pre-wrap text-sm">
				{text ? parseSeesaaWikiText(text) : "-"}
			</div>
		</article>
	);
}

export function FriendsTextSection({
	introductionText,
	zukanText,
}: {
	introductionText: string;
	zukanText: string;
}) {
	return (
		<section className="mb-6">
			<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">基本テキスト</h2>
			<div className="grid gap-3 md:grid-cols-2">
				<TextBlock title="自己紹介" text={introductionText} />
				<TextBlock title="ずかん" text={zukanText} />
			</div>
		</section>
	);
}
