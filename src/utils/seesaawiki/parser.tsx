import React from "react";

export function parseSeesaaWikiNewLine(text: string): React.ReactElement {
	const parts = text.split('~~');

	return (
		<>
			{parts.map((part: string, index: number) =>
				<span key={index}>
					{part}
					{index < parts.length - 1 && <br />}
				</span>
			)}
		</>
	);
}

export function parseSeesaaWikiColor(text: string): string {
	return text.replace(/&color\(.*?\){(.*?)}/g, '$1');
}

export function parseSeesaaWikiText(text: string): React.ReactElement {
	return parseSeesaaWikiNewLine(parseSeesaaWikiColor(text));
}