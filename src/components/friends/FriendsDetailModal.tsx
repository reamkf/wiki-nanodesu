'use client';

import { Fragment, useMemo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { parseSeesaaWikiNewLine } from '@/utils/seesaawiki/parser';

import { SeesaaWikiImage } from '@/components/seesaawiki/SeesaaWikiImage';
import { FriendsAttributeIconAndName } from '@/components/friends/FriendsAttributeIconAndName';
import { Flag } from '@/components/friends/Flag';
import { PhotoAttributeIcon } from '@/components/photo/PhotoAttributeIconAndName';

import type { FriendsDataRow } from '@/types/friends';
import type { ActionValues, TryValues } from '@/types/flag';
import { FlagType } from '@/types/flag';

interface FriendsDetailModalProps {
	friend: FriendsDataRow;
	isOpen: boolean;
	onClose: () => void;
}

type SkillItem = {
	kind: string;
	name: string;
	description: string;
	mp?: number | null;
	showMiraclePlus?: boolean;
	photoAttribute?: FriendsDataRow['wildPhotoAttribute'];
};

function MiraclePlusFlag() {
	return (
		<span className="bg-sky-100 text-sky-900 px-[6px] py-[2px] text-[0.7rem] rounded-xs font-bold">
			ミラクル+
		</span>
	);
}

function nonEmpty(value: string | null | undefined): value is string {
	return typeof value === 'string' && value.trim() !== '';
}

export function FriendsDetailModal({ friend, isOpen, onClose }: FriendsDetailModalProps) {
	const skillItems = useMemo<SkillItem[]>(() => {
		const items: SkillItem[] = [];

		items.push({
			kind: 'けものミラクル',
			name: friend.miracleName,
			description: friend.miracleEffectLv5,
			mp: friend.miracleRequiredMp,
			showMiraclePlus: friend.isMiraclePlus,
		});

		items.push({
			kind: 'とくいわざ',
			name: friend.tokuiWazaName,
			description: friend.tokuiWazaEffect,
		});

		items.push({
			kind: 'たいきスキル',
			name: friend.taikiSkillName,
			description:
				friend.taikiSkillEffect +
				((friend.taikiSkillActivationRate !== null && friend.taikiSkillActivationRate !== undefined) ||
					(friend.taikiSkillActivationCount !== null && friend.taikiSkillActivationCount !== undefined)
					? `\n\n発動率：${friend.taikiSkillActivationRate ?? '-'}%　発動回数：${friend.taikiSkillActivationCount ?? '-'}回`
					: ''),
		});

		items.push({
			kind: 'とくせい',
			name: friend.tokuseiName,
			description: friend.tokuseiEffect,
		});

		items.push({
			kind: 'キセキとくせい',
			name: friend.kisekiTokuseiName,
			description: friend.kisekiTokuseiEffect,
		});

		if (nonEmpty(friend.nanairoTokuseiName) || nonEmpty(friend.nanairoTokuseiEffect)) {
			items.push({
				kind: 'なないろとくせい',
				name: friend.nanairoTokuseiName,
				description: friend.nanairoTokuseiEffect,
			});
		}

		items.push({
			kind: '動物フォト',
			name: '',
			description: nonEmpty(friend.wildPhotoTraitChanged) ? friend.wildPhotoTraitChanged : friend.wildPhotoTrait,
			photoAttribute: friend.wildPhotoAttribute,
		});

		return items;
	}, [friend]);

	const actionFlags = friend.status.actionFlags ?? [];
	const tryFlags = friend.status.tryFlags ?? [];
	const beatFlags = friend.status.beatFlags ?? 0;
	const flagSize = 100;

	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-50" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/25" />
				</TransitionChild>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<TransitionChild
							as={Fragment}
							enter="ease-out duration-200"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								<DialogTitle as="h1" className="text-lg font-extrabold leading-6 text-gray-900">
									{friend.name}
								</DialogTitle>

								<div className="mt-4">
									<div className="flex items-start gap-4">
										<div className="shrink-0">
											<SeesaaWikiImage
												src={friend.iconUrl}
												alt={friend.name}
												width={80}
												height={80}
												referrerPolicy="no-referrer"
											/>
										</div>

										<div className="flex flex-col items-start gap-2">
											{Array.from({ length: Math.max(0, beatFlags) }).map((_, index) => (
												<Flag
													key={`beat-${index}`}
													flagType={FlagType.Beat}
													size={flagSize}
												/>
											))}
											{actionFlags.map((value, index) => (
												<Flag
													key={`action-${value}-${index}`}
													flagType={FlagType.Action}
													value={value as ActionValues}
													size={flagSize}
												/>
											))}
											{tryFlags.map((value, index) => (
												<Flag
													key={`try-${value}-${index}`}
													flagType={FlagType.Try}
													value={value as TryValues}
													size={flagSize}
												/>
											))}
										</div>
									</div>

									<div className="mt-3 flex items-center gap-4">
										<FriendsAttributeIconAndName attribute={friend.attribute} />
									</div>
								</div>

								<div className="mt-6">
									<h2 className="text-base font-bold text-gray-900">スキル</h2>
									<div className="mt-2 space-y-3">
										{skillItems.map((skill) => (
											<div key={skill.kind} className="rounded-md border border-gray-200 p-3">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-xs font-bold text-gray-600">{skill.kind}</span>
													{skill.kind === '動物フォト' && skill.photoAttribute !== undefined && (
														<PhotoAttributeIcon attribute={skill.photoAttribute} showText={false} size={24} />
													)}
													{skill.kind !== '動物フォト' &&
														<span className="text-sm font-semibold text-gray-900">{skill.name || '-'}</span>
													}
													{skill.kind === 'けものミラクル' && (
														<>
															{skill.mp !== null && skill.mp !== undefined && (
																<span className="text-xs text-gray-700">必要MP: {skill.mp}</span>
															)}
															{skill.showMiraclePlus && <MiraclePlusFlag />}
														</>
													)}
												</div>

												<div className="mt-2 ml-4 text-sm text-gray-700">
													{skill.description ? parseSeesaaWikiNewLine(skill.description) : '-'}
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="mt-6">
									<button
										type="button"
										className="inline-flex justify-center rounded-md border border-transparent bg-sky-100 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 transition-colors duration-200"
										onClick={onClose}
									>
										閉じる
									</button>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
