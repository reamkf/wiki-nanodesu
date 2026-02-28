import React from "react";

export function parseSeesaaWikiNewLine(text: string): React.ReactElement {
	text = text.replace(/(~~)(~~~)*/g, '~~~$2');
	text = text.replace(/~~~/g, '\n');
	const parts = text.split('\n');

	// 重複する行に対応するため、出現回数を追跡してユニークキーを生成する
	const keyCounts = new Map<string, number>();
	const partsWithKeys = parts.map((part: string) => {
		const count = keyCounts.get(part) || 0;
		keyCounts.set(part, count + 1);
		return { part, key: count === 0 ? `line-${part}` : `line-${part}-${count}` };
	});

	return (
		<>
			{/* テキスト分割結果を安定したキーでレンダリングする */}
			{partsWithKeys.map(({ part, key }, idx) =>
				<span key={key}>
					{part}
					{idx < partsWithKeys.length - 1 && <br />}
				</span>
			)}
		</>
	);
}

function parseSeesaaWikiColor(text: string): string {
	return text.replace(/&color\(.*?\){(.*?)}/g, '$1');
}

export function parseSeesaaWikiText(text: string): React.ReactElement {
	return parseSeesaaWikiNewLine(parseSeesaaWikiColor(text));
}