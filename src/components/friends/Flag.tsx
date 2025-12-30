import { FlagType, ActionValues, TryValues, FLAG_BG_CLASSES, TRY_VALUE_TEXT_CLASSES } from "@/types/flag";

export function Flag({
	flagType,
	size = 100,
	value = null,
}: {
	flagType: FlagType;
	size?: number;
	value?: ActionValues | TryValues | number | null;
}) {
	const bgClass = FLAG_BG_CLASSES[flagType];
	const valueTextClass =
		flagType === FlagType.Try && value !== null
			? TRY_VALUE_TEXT_CLASSES[value as TryValues]
			: "text-white";

	const w = size;
	const h = size * 0.3;

	return (
		<div
			className={`${bgClass} inline-flex items-center justify-center text-center text-white font-bold px-2 py-1 rounded-xs`}
			style={{
				width: `${w}px`,
				height: `${h}px`,
			}}
		>
			<span>{flagType}</span>
			{value !== null && (
				<span className={`ml-1 font-bold ${valueTextClass}`}>
					{value}
				</span>
			)}
		</div>
	);
}

export function BeatFlag() {
	return (
		<Flag
			flagType={FlagType.Beat}
		/>
	);
}

export function ActionFlag({ value }: { value: ActionValues }) {
	return (
		<Flag
			flagType={FlagType.Action}
			value={value}
		/>
	);
}

export function TryFlag({ value }: { value: TryValues }) {
	return (
		<Flag
			flagType={FlagType.Try}
			value={value}
		/>
	);
}
