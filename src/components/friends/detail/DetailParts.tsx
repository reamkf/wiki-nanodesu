import { useId, type ReactNode } from "react";
import { Heading } from "@/components/section/Heading";

// フレンズ個別ページの共通見た目を集約する部品群
// 配色は「白＋gray＋既存の青(#2196f3)」を基本にし、属性色など意味を持つ色以外は増やさない

// ページレベルの大分類(H2相当)。見出しは既存サイトのHeadingに統一する
export function DetailSection({
	title,
	id,
	children,
}: {
	title: string;
	id: string;
	children: ReactNode;
}) {
	return (
		<section className="mb-6">
			<Heading title={title} id={id} level={2} />
			<div className="mt-3">{children}</div>
		</section>
	);
}

// 白いカード。スキルやテキストなどの中分類(H3相当)の器
export function DetailCard({
	title,
	id,
	children,
	className,
}: {
	title?: string;
	id?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className ?? ""}`}
		>
			{title &&
				(id ? (
					<Heading title={title} id={id} level={3} />
				) : (
					<h3 className="mb-2 border-b border-[#808080] pb-0 text-[0.9rem] font-semibold text-[#101010]">
						{title}
					</h3>
				))}
			<div className={title ? "mt-2" : ""}>{children}</div>
		</div>
	);
}

// カード内の「ラベル＋値」の1項目
export function DetailField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<p className="text-xs font-semibold text-gray-500">{label}</p>
			<div className="mt-0.5 text-sm text-gray-900">{children}</div>
		</div>
	);
}

// ステータス数値の1マス。dlの子として使う
export function StatCard({
	label,
	value,
	estimated,
}: {
	label: string;
	value: string;
	estimated?: boolean;
}) {
	return (
		<div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
			<dt className="text-xs font-semibold text-gray-500">{label}</dt>
			<dd
				className={`mt-0.5 text-lg font-bold tabular-nums ${
					estimated ? "italic text-red-600" : "text-gray-900"
				}`}
			>
				{value}
			</dd>
		</div>
	);
}

interface SegmentOption<T extends string | number> {
	value: T;
	label: string;
	disabled?: boolean;
}

// 候補が固定の選択肢を横並びのボタン群で切り替える。selectより現在値を認識しやすい
export function SegmentGroup<T extends string | number>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: SegmentOption<T>[];
	onChange: (value: T) => void;
}) {
	const labelId = useId();
	return (
		<div className="flex flex-wrap items-center gap-2">
			<span id={labelId} className="text-sm font-semibold text-gray-700">
				{label}
			</span>
			<fieldset aria-labelledby={labelId} className="m-0 border-0 p-0">
				<div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
					{options.map((option) => {
						const selected = option.value === value;
						return (
							<button
								key={String(option.value)}
								type="button"
								aria-pressed={selected}
								disabled={option.disabled}
								onClick={() => onChange(option.value)}
								className={`rounded-md px-3 py-1 text-sm font-bold ${
									selected
										? "bg-[#2196f3] text-white shadow-sm"
										: "bg-transparent text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								}`}
							>
								{option.label}
							</button>
						);
					})}
				</div>
			</fieldset>
		</div>
	);
}
