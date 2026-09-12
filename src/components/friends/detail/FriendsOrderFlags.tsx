import { FriendsDataRow } from "@/types/friends";
import { DetailCard, DetailSection } from "./DetailParts";

function formatFlags(flags: number[] | null): string {
	return flags && flags.length > 0 ? flags.join(", ") : "-";
}

function formatSpecialFlags(flags: number[][] | null): string {
	return flags && flags.length > 0
		? flags.map(([action, tryValue]) => `A${action}T${tryValue}`).join(", ")
		: "-";
}

function FlagRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-gray-100 py-1 last:border-b-0">
			<dt className="text-sm font-semibold text-gray-600">{label}</dt>
			<dd className="text-sm text-gray-900">{value}</dd>
		</div>
	);
}

export function FriendsOrderFlags({
	friend,
	showTitle = true,
}: {
	friend: FriendsDataRow;
	showTitle?: boolean;
}) {
	const { status } = friend;
	const damageUp = friend.hasYasei5 ? status.flagDamageUpYasei5 : status.flagDamageUp;

	const body = (
		<DetailCard className="max-w-2xl">
			<dl>
				<FlagRow label="Beat" value={status.beatFlags ?? "-"} />
				<FlagRow label="Action" value={formatFlags(status.actionFlags)} />
				<FlagRow label="Try" value={formatFlags(status.tryFlags)} />
				<FlagRow label="Special" value={formatSpecialFlags(status.specialFlags)} />
				<FlagRow label="ぷらずむ" value={status.plasm ?? "-"} />
				<FlagRow
					label="フラッグ補正"
					value={
						<>
							Beat {damageUp.beat ?? "-"}% / Action {damageUp.action ?? "-"}% / Try{" "}
							{damageUp.try ?? "-"}%
						</>
					}
				/>
			</dl>
		</DetailCard>
	);

	// 比較ページでは見出しなしのカードだけを使う
	if (!showTitle) {
		return body;
	}

	return (
		<DetailSection title="フラッグ・その他" id="flags">
			{body}
		</DetailSection>
	);
}
