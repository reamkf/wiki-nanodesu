export enum FlagType {
	Beat = "Beat!!!",
	Action = "Action!",
	Try = "Try!!",
}
export type FlagTypeKeys = keyof typeof FlagType;

export type ActionValues = 5 | 10 | 15 | 20 | 25 | 30;
export type TryValues = 20 | 30 | 40;

export const FLAG_COLORS = {
	[FlagType.Beat]: "#ff6b2b",
	[FlagType.Action]: "#0f84de",
	[FlagType.Try]: "#4cc826",
};

export const TRY_COLORS = {
	20: "#a6ecff",
	30: "#fde13c",
	40: "#fc539e",
};
export const FLAG_BG_CLASSES: Record<FlagType, string> = {
	[FlagType.Beat]: "bg-[#ff6b2b]",
	[FlagType.Action]: "bg-[#0f84de]",
	[FlagType.Try]: "bg-[#4cc826]",
};

export const TRY_VALUE_TEXT_CLASSES: Record<TryValues, string> = {
	20: "text-[#a6ecff]",
	30: "text-[#fde13c]",
	40: "text-[#fc539e]",
};
