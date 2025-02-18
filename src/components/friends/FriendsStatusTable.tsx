import { FriendsDataRow } from "@/types/friends";
import FriendsIcon from "..//friends/FriendsIcon";
import { FriendsNameLink } from "../friends/FriendsNameLink";
import { calcKemosute } from "@/utils/common";
interface DataTableProps {
	friendsData: FriendsDataRow[];
}

export default function FriendsStatusTable({ friendsData }: DataTableProps) {
	if (friendsData.length === 0) return null;

	const headers = [
		'一覧順', 'アイコン', 'フレンズ名', '属性',
		'けもステ', 'たいりょく', 'こうげき', 'まもり', 'かいひ'
	];

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-collapse">
				<thead>
					<tr className="bg-gray-100">
						{headers.map((header) => (
							<th key={header} className="border px-4 py-2 text-left">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{friendsData.map((row) => {
						const icon = <FriendsIcon friendsData={row} size={55} />;
						const cells = [
							row.list_index,
							icon,
							<FriendsNameLink friend={row} key={row.id} />,
							row.attribute,
							calcKemosute(row.status.statusInitial),
							row.status.statusInitial.hp,
							row.status.statusInitial.atk,
							row.status.statusInitial.def,
							row.status.avoid,
						];

						return (
							<tr key={row.id} className="hover:bg-gray-50">
								{cells.map((cell, index) => (
									<td key={index} className="border px-4 py-2">
										{cell}
									</td>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
