import { BasicStatus } from "@/types/friendsOrPhoto";
import { calcKemosute } from "@/utils/status";
import { toPercent } from "@/utils/common";
import { StatCard } from "./DetailParts";

function formatNumber(value: number | null | undefined): string {
	return value === null || value === undefined ? "-" : value.toLocaleString();
}

function formatAvoid(value: number | null): string {
	return value === null ? "-" : toPercent(value, 1);
}

export interface FriendsStatusViewProps {
	status: BasicStatus;
	avoid: number | null;
	plasm: number | null;
}

// 6列テーブルではなく、PCでもスマホでも読めるstat cardのグリッドにする
export function FriendsStatusView({ status, avoid, plasm }: FriendsStatusViewProps) {
	const kemosute =
		status.hp === null || status.atk === null || status.def === null
			? null
			: calcKemosute(status.hp, status.atk, status.def);

	return (
		<dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
			<StatCard
				label="けもステ"
				value={formatNumber(kemosute)}
				estimated={status.estimated}
			/>
			<StatCard
				label="たいりょく"
				value={formatNumber(status.hp)}
				estimated={status.estimated}
			/>
			<StatCard
				label="こうげき"
				value={formatNumber(status.atk)}
				estimated={status.estimated}
			/>
			<StatCard
				label="まもり"
				value={formatNumber(status.def)}
				estimated={status.estimated}
			/>
			<StatCard label="かいひ" value={formatAvoid(avoid)} estimated={status.estimated} />
			<StatCard label="ぷらずむ" value={formatNumber(plasm)} estimated={status.estimated} />
		</dl>
	);
}
