"use client";

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { FriendsBasicInfo } from "@/components/friends/detail/FriendsBasicInfo";
import {
	FRIENDS_STATUS_LEVELS,
	FriendsStatusLevel,
	FriendsStatusYasei,
	getFriendsStatus,
} from "@/components/friends/detail/FriendsStatusSection.client";
import { FriendsStatusView } from "@/components/friends/detail/FriendsStatusView";
import { FriendsOrderFlags } from "@/components/friends/detail/FriendsOrderFlags";
import { FriendsSkillCard } from "@/components/friends/detail/FriendsSkillCard";
import { FriendsTextSection } from "@/components/friends/detail/FriendsTextSection";
import { FriendsWildPhoto } from "@/components/friends/detail/FriendsWildPhoto";
import { FriendsDataRow } from "@/types/friends";

interface SkillProps {
	name: string;
	effect: string;
	entries?: { label: string; text: string }[];
	showEffect?: boolean;
}

function getFriendLabel(friend: FriendsDataRow): string {
	return friend.secondName ? `${friend.secondName} ${friend.name}` : friend.name;
}

function PairSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="mb-6">
			<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">{title}</h2>
			<div className="grid gap-4 md:grid-cols-2">{children}</div>
		</section>
	);
}

function SkillPair({
	title,
	id,
	leftName,
	rightName,
	left,
	right,
}: {
	title: string;
	id: string;
	leftName: string;
	rightName: string;
	left: SkillProps;
	right: SkillProps;
}) {
	return (
		<PairSection title={title}>
			<FriendsSkillCard title={leftName} id={`${id}-left`} {...left} />
			<FriendsSkillCard title={rightName} id={`${id}-right`} {...right} />
		</PairSection>
	);
}

function miracleProps(friend: FriendsDataRow): SkillProps {
	return {
		name: friend.miracleName,
		effect: "",
		showEffect: false,
		entries: [
			{ label: "必要MP", text: friend.miracleRequiredMp?.toString() || "-" },
			{ label: "Lv.1", text: friend.miracleEffectLv1 },
			{ label: "Lv.5", text: friend.miracleEffectLv5 },
			{ label: "けものミラクル＋", text: friend.miraclePlus },
		],
	};
}

function waitSkillProps(friend: FriendsDataRow): SkillProps {
	return {
		name: friend.waitSkillName,
		effect: friend.waitSkillEffect,
		entries: [
			{ label: "発動率", text: friend.waitSkillActivationRate },
			{ label: "発動回数", text: friend.waitSkillActivationCount },
		],
	};
}

function updateQuery(leftId: string, rightId: string) {
	const params = new URLSearchParams(window.location.search);
	params.set("left", leftId);
	params.set("right", rightId);
	window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function readQuerySelection(
	friendsById: Map<string, FriendsDataRow>,
	defaultLeftId: string,
	defaultRightId: string,
) {
	const params = new URLSearchParams(window.location.search);
	const queryLeft = params.get("left");
	const queryRight = params.get("right");
	return {
		leftId: queryLeft && friendsById.has(queryLeft) ? queryLeft : defaultLeftId,
		rightId: queryRight && friendsById.has(queryRight) ? queryRight : defaultRightId,
	};
}

export default function FriendsCompare({ friends }: { friends: FriendsDataRow[] }) {
	const sortedFriends = useMemo(
		() =>
			[...friends].sort(
				(a, b) => a.listIndex - b.listIndex || a.name.localeCompare(b.name, "ja"),
			),
		[friends],
	);
	const friendsById = useMemo(
		() => new Map(sortedFriends.map((friend) => [friend.id, friend])),
		[sortedFriends],
	);
	const defaultLeftId = sortedFriends[0]?.id || "";
	const defaultRightId = sortedFriends.find((friend) => friend.id !== defaultLeftId)?.id || "";
	const [selectedLeftId, setSelectedLeftId] = useState(defaultLeftId);
	const [selectedRightId, setSelectedRightId] = useState(defaultRightId);
	const [level, setLevel] = useState<FriendsStatusLevel>(90);
	const [yasei, setYasei] = useState<FriendsStatusYasei>(4);
	const isMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
	const querySelection = isMounted
		? readQuerySelection(friendsById, defaultLeftId, defaultRightId)
		: null;
	const leftId = querySelection?.leftId || selectedLeftId;
	const rightId = querySelection?.rightId || selectedRightId;

	const left = friendsById.get(leftId) || sortedFriends[0];
	const right = friendsById.get(rightId) || sortedFriends[1] || sortedFriends[0];

	if (!left || !right) {
		return <p>比較できるフレンズがありません。</p>;
	}

	const leftStatus = getFriendsStatus(left, level, yasei);
	const rightStatus = getFriendsStatus(right, level, yasei);
	const handleLeftChange = (id: string) => {
		setSelectedLeftId(id);
		updateQuery(id, right.id);
	};
	const handleRightChange = (id: string) => {
		setSelectedRightId(id);
		updateQuery(left.id, id);
	};

	return (
		<div>
			<h1 className="mb-4 border-b-2 border-sky-300 text-xl font-bold">フレンズ比較</h1>
			<div className="mb-6 grid gap-3 rounded border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
				<label className="grid gap-1 font-semibold" htmlFor="friends-compare-left">
					左のフレンズ
					<select
						id="friends-compare-left"
						className="rounded border border-gray-300 bg-white px-2 py-1 font-normal"
						value={left.id}
						onChange={(event) => handleLeftChange(event.target.value)}
					>
						{sortedFriends.map((friend) => (
							<option key={friend.id} value={friend.id}>
								{getFriendLabel(friend)}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-1 font-semibold" htmlFor="friends-compare-right">
					右のフレンズ
					<select
						id="friends-compare-right"
						className="rounded border border-gray-300 bg-white px-2 py-1 font-normal"
						value={right.id}
						onChange={(event) => handleRightChange(event.target.value)}
					>
						{sortedFriends.map((friend) => (
							<option key={friend.id} value={friend.id}>
								{getFriendLabel(friend)}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<FriendsBasicInfo friend={left} />
				<FriendsBasicInfo friend={right} />
			</div>

			<section className="mb-6">
				<h2 className="mb-3 border-b-2 border-sky-300 pb-1 text-lg font-bold">
					ステータス
				</h2>
				<div className="mb-3 flex flex-wrap items-center gap-3">
					<label className="font-semibold" htmlFor="friends-compare-level">
						レベル
					</label>
					<select
						id="friends-compare-level"
						className="rounded border border-gray-300 bg-white px-2 py-1"
						value={level}
						onChange={(event) =>
							setLevel(Number(event.target.value) as FriendsStatusLevel)
						}
					>
						{FRIENDS_STATUS_LEVELS.map((value) => (
							<option key={value} value={value}>
								Lv{value}
							</option>
						))}
					</select>
					<label className="font-semibold" htmlFor="friends-compare-yasei">
						野生解放
					</label>
					<select
						id="friends-compare-yasei"
						className="rounded border border-gray-300 bg-white px-2 py-1"
						value={yasei}
						onChange={(event) =>
							setYasei(Number(event.target.value) as FriendsStatusYasei)
						}
					>
						<option value={4}>野生4</option>
						<option value={5} disabled={!left.hasYasei5 && !right.hasYasei5}>
							野生5
						</option>
					</select>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<FriendsStatusView
						status={leftStatus}
						avoid={yasei === 5 ? left.status.avoidYasei5 : left.status.avoid}
						plasm={left.status.plasm}
					/>
					<FriendsStatusView
						status={rightStatus}
						avoid={yasei === 5 ? right.status.avoidYasei5 : right.status.avoid}
						plasm={right.status.plasm}
					/>
				</div>
			</section>

			<PairSection title="フラッグ・その他">
				<FriendsOrderFlags friend={left} showTitle={false} />
				<FriendsOrderFlags friend={right} showTitle={false} />
			</PairSection>
			<SkillPair
				title="けものミラクル"
				id="compare-skill-miracle"
				leftName={getFriendLabel(left)}
				rightName={getFriendLabel(right)}
				left={miracleProps(left)}
				right={miracleProps(right)}
			/>
			<SkillPair
				title="とくいわざ"
				id="compare-skill-special"
				leftName={getFriendLabel(left)}
				rightName={getFriendLabel(right)}
				left={{ name: left.specialMoveName, effect: left.specialMoveEffect }}
				right={{ name: right.specialMoveName, effect: right.specialMoveEffect }}
			/>
			<SkillPair
				title="たいきスキル"
				id="compare-skill-wait"
				leftName={getFriendLabel(left)}
				rightName={getFriendLabel(right)}
				left={waitSkillProps(left)}
				right={waitSkillProps(right)}
			/>
			<SkillPair
				title="とくせい"
				id="compare-skill-trait"
				leftName={getFriendLabel(left)}
				rightName={getFriendLabel(right)}
				left={{ name: left.traitName, effect: left.traitEffect }}
				right={{ name: right.traitName, effect: right.traitEffect }}
			/>
			<SkillPair
				title="キセキとくせい"
				id="compare-skill-kiseki"
				leftName={getFriendLabel(left)}
				rightName={getFriendLabel(right)}
				left={{ name: left.kisekitraitName, effect: left.kisekitraitEffect }}
				right={{ name: right.kisekitraitName, effect: right.kisekitraitEffect }}
			/>
			<SkillPair
				title="なないろとくせい"
				id="compare-skill-nanairo"
				leftName={getFriendLabel(left)}
				rightName={getFriendLabel(right)}
				left={{ name: left.nanairoSkillName, effect: left.nanairoSkillEffect }}
				right={{ name: right.nanairoSkillName, effect: right.nanairoSkillEffect }}
			/>

			<PairSection title="基本テキスト">
				<FriendsTextSection
					introductionText={left.introductionText}
					zukanText={left.zukanText}
					showTitle={false}
				/>
				<FriendsTextSection
					introductionText={right.introductionText}
					zukanText={right.zukanText}
					showTitle={false}
				/>
			</PairSection>
			<PairSection title="動物フォト">
				<FriendsWildPhoto friend={left} showTitle={false} />
				<FriendsWildPhoto friend={right} showTitle={false} />
			</PairSection>
		</div>
	);
}
