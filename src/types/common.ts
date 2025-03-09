export type AlignType = "left" | "center" | "right";

export interface ColumnMeta {
	align: AlignType;
	width?: string;
}

export type SkillType = 'けものミラクル' | 'とくいわざ' | 'たいきスキル' | 'とくせい' | 'キセキとくせい' | 'なないろとくせい';

export interface BasicStatus {
	kemosute?: number | null;
	hp: number | null;
	atk: number | null;
	def: number | null;
	estimated?: boolean;
}
