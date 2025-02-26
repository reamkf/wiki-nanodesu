export type AlignType = "left" | "center" | "right";

export interface ColumnMeta {
	align: AlignType;
	width?: string;
}


export interface BasicStatus {
	kemosute?: number | null;
	hp: number | null;
	atk: number | null;
	def: number | null;
	estimated?: boolean;
}
