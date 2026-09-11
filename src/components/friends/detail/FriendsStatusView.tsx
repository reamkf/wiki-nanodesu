import { BasicStatus } from "@/types/friendsOrPhoto";
import { calcKemosute } from "@/utils/status";
import { toPercent } from "@/utils/common";

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

export function FriendsStatusView({ status, avoid, plasm }: FriendsStatusViewProps) {
	const kemosute =
		status.hp === null || status.atk === null || status.def === null
			? null
			: calcKemosute(status.hp, status.atk, status.def);
	const valueClass = status.estimated ? "italic text-red-600" : "";

	return (
		<div className="overflow-x-auto">
			<table className="min-w-[28rem] border-collapse text-sm">
				<thead>
					<tr className="bg-gray-100">
						<th className="border border-gray-300 px-3 py-2 text-left">けもステ</th>
						<th className="border border-gray-300 px-3 py-2 text-left">たいりょく</th>
						<th className="border border-gray-300 px-3 py-2 text-left">こうげき</th>
						<th className="border border-gray-300 px-3 py-2 text-left">まもり</th>
						<th className="border border-gray-300 px-3 py-2 text-left">かいひ</th>
						<th className="border border-gray-300 px-3 py-2 text-left">ぷらずむ</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td className={`border border-gray-300 px-3 py-2 ${valueClass}`}>
							{formatNumber(kemosute)}
						</td>
						<td className={`border border-gray-300 px-3 py-2 ${valueClass}`}>
							{formatNumber(status.hp)}
						</td>
						<td className={`border border-gray-300 px-3 py-2 ${valueClass}`}>
							{formatNumber(status.atk)}
						</td>
						<td className={`border border-gray-300 px-3 py-2 ${valueClass}`}>
							{formatNumber(status.def)}
						</td>
						<td className={`border border-gray-300 px-3 py-2 ${valueClass}`}>
							{formatAvoid(avoid)}
						</td>
						<td className={`border border-gray-300 px-3 py-2 ${valueClass}`}>
							{formatNumber(plasm)}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
