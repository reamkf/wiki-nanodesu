import { FriendsDataRow } from "@/types/friends";

function formatFlags(flags: number[] | null): string {
	return flags && flags.length > 0 ? flags.join(", ") : "-";
}

function formatSpecialFlags(flags: number[][] | null): string {
	return flags && flags.length > 0
		? flags.map(([action, tryValue]) => `A${action}T${tryValue}`).join(", ")
		: "-";
}

export function FriendsOrderFlags({ friend }: { friend: FriendsDataRow }) {
	const { status } = friend;
	const damageUp = friend.hasYasei5 ? status.flagDamageUpYasei5 : status.flagDamageUp;

	return (
		<section className="mb-6">
			<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">
				フラッグ・その他
			</h2>
			<dl className="grid max-w-2xl grid-cols-[8rem_1fr] text-sm">
				<dt className="border-b border-gray-200 py-1 font-semibold">Beat</dt>
				<dd className="border-b border-gray-200 py-1">{status.beatFlags ?? "-"}</dd>
				<dt className="border-b border-gray-200 py-1 font-semibold">Action</dt>
				<dd className="border-b border-gray-200 py-1">{formatFlags(status.actionFlags)}</dd>
				<dt className="border-b border-gray-200 py-1 font-semibold">Try</dt>
				<dd className="border-b border-gray-200 py-1">{formatFlags(status.tryFlags)}</dd>
				<dt className="border-b border-gray-200 py-1 font-semibold">Special</dt>
				<dd className="border-b border-gray-200 py-1">
					{formatSpecialFlags(status.specialFlags)}
				</dd>
				<dt className="border-b border-gray-200 py-1 font-semibold">ぷらずむ</dt>
				<dd className="border-b border-gray-200 py-1">{status.plasm ?? "-"}</dd>
				<dt className="border-b border-gray-200 py-1 font-semibold">フラッグ補正</dt>
				<dd className="border-b border-gray-200 py-1">
					Beat {damageUp.beat ?? "-"}% / Action {damageUp.action ?? "-"}% / Try{" "}
					{damageUp.try ?? "-"}%
				</dd>
			</dl>
		</section>
	);
}
