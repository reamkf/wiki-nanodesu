"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { PhotoDataRow, PhotoDamageDataRow, PhotoAttribute } from "@/types/photo";
import { ColumnDef } from "@tanstack/react-table";
import { createCustomFilterFn } from "@/utils/tableFilters";
import { Table } from "@/components/table/Table";
import { FriendOrPhotoDisplay, WithFriendOrPhoto, getSearchableTextForFriendOrPhoto } from "@/components/table/GenericDataTable";
import { parseSeesaaWikiText } from "@/utils/seesaawiki/parser";
import { FilterCheckboxGroup, CheckboxOption } from "@/components/table/FilterCheckboxGroup";
import { PhotoAttributeIcon } from "@/components/photo/PhotoAttributeIconAndName";
import { FormControl, Select, MenuItem } from "@mui/material";

interface DamageDataWithPhoto extends PhotoDamageDataRow {
	photoData?: PhotoDataRow;
	calculatedPower: Record<string, number>;
}

interface ClientPageProps {
	photoData: PhotoDataRow[];
	photoDamageData: PhotoDamageDataRow[];
}

function PowerCell({ data, calculationKey }: { data: DamageDataWithPhoto, calculationKey: string }) {
	const power = data.calculatedPower[calculationKey];
	if (!power) return <span className="text-gray-400">-</span>;

	return (
		<div className="text-center">
			{power.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
		</div>
	);
};

function TraitCell({ data }: { data: DamageDataWithPhoto }) {
	if (!data.photoData) {
		return <div className="text-sm text-gray-400">-</div>;
	}

	const traitText = data.changeState === '変化後' ? data.photoData.traitChanged : (data.photoData.trait || '-');

	if (traitText === '-') {
		return <div className="text-sm">-</div>;
	}

	return (
		<div className="text-sm">
			{parseSeesaaWikiText(traitText)}
		</div>
	);
};

function ConditionCell({ data }: { data: DamageDataWithPhoto }) {
	if (!data.condition) {
		return <div className="text-sm text-gray-400">-</div>;
	}

	return (
		<div className="text-sm">
			{parseSeesaaWikiText(data.condition)}
		</div>
	);
};

export default function ClientPage({ photoData, photoDamageData }: ClientPageProps) {
	const [baseAttack, setBaseAttack] = useState<number>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.photo-damage-ranking.baseAttack");
			return saved ? parseInt(saved) : 20000;
		}
		return 20000;
	});
	const [isMounted, setIsMounted] = useState(false);

	const [selectedAttributes, setSelectedAttributes] = useState<Set<PhotoAttribute>>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.photo-damage-ranking.selectedAttributes");
			return saved ? new Set(JSON.parse(saved)) : new Set(Object.values(PhotoAttribute));
		}
		return new Set(Object.values(PhotoAttribute));
	});

	const [selectedRarities, setSelectedRarities] = useState<Set<number>>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.photo-damage-ranking.selectedRarities");
			return saved ? new Set(JSON.parse(saved)) : new Set([1, 2, 3, 4]);
		}
		return new Set([1, 2, 3, 4]);
	});

	const [selectedChangeStates, setSelectedChangeStates] = useState<Set<string>>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("wiki-nanodesu.photo-damage-ranking.selectedChangeStates");
			return saved ? new Set(JSON.parse(saved)) : new Set(['変化前', '変化後']);
		}
		return new Set(['変化前', '変化後']);
	});

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("wiki-nanodesu.photo-damage-ranking.baseAttack", baseAttack.toString());
			localStorage.setItem("wiki-nanodesu.photo-damage-ranking.selectedAttributes", JSON.stringify(Array.from(selectedAttributes)));
			localStorage.setItem("wiki-nanodesu.photo-damage-ranking.selectedRarities", JSON.stringify(Array.from(selectedRarities)));
			localStorage.setItem("wiki-nanodesu.photo-damage-ranking.selectedChangeStates", JSON.stringify(Array.from(selectedChangeStates)));
		}
	}, [baseAttack, selectedAttributes, selectedRarities, selectedChangeStates]);

	const damageDataWithPhoto = useMemo(() => {
		return photoDamageData
			.map(damage => {
				const relatedPhoto = photoData.find(photo =>
					photo.name === damage.photoId || photo.name === damage.photoId + '(フォト)'
				);

				const calculatePower = (attackValue: number, pocketLv: number) => {
					if (!relatedPhoto) return 0;

					const status = damage.changeState === '変化前' ? relatedPhoto.status.statusMedium : relatedPhoto.status.statusMax;
					const photoAttack = status?.atk || NaN;
					const adjustedPhotoAttack = Math.ceil(photoAttack * (1 + (pocketLv - 1) * 0.25));
					return (baseAttack + adjustedPhotoAttack) * damage.damageMultiplier / baseAttack;
				};

				const calculatedPower: Record<string, number> = {};
				['Lv1', 'Lv2', 'Lv3'].forEach(level => {
					const pocketLv = parseInt(level.replace('Lv', ''));
					calculatedPower[level] = calculatePower(baseAttack, pocketLv);
				});

				return {
					...damage,
					photoData: relatedPhoto,
					calculatedPower
				};
			})
			.filter(damage => damage.photoData !== undefined);
	}, [photoData, photoDamageData, baseAttack]);

	const filteredData = useMemo(() => {
		if (!isMounted) {
			return damageDataWithPhoto;
		}

		return damageDataWithPhoto.filter(item => {
			if (!item.photoData) return false;

			return selectedAttributes.has(item.photoData.attribute) &&
				selectedRarities.has(item.photoData.rarity) &&
				selectedChangeStates.has(item.changeState);
		});
	}, [damageDataWithPhoto, selectedAttributes, selectedRarities, selectedChangeStates, isMounted]);

	const getSearchableText = useCallback((row: DamageDataWithPhoto, columnId: string): string => {
		if (!row.photoData) return '';

		const photoAsWithFriendOrPhoto: WithFriendOrPhoto = {
			isPhoto: true,
			photoDataRow: row.photoData,
			skillType: row.photoData.traitChanged && row.photoData.traitChanged !== row.photoData.trait ? 'とくせい(変化後)' : 'とくせい(変化前)'
		};

		switch (columnId) {
			case 'name':
			case 'attribute':
				return getSearchableTextForFriendOrPhoto(photoAsWithFriendOrPhoto, columnId);
			case 'trait':
				return row.changeState === '変化後' ? row.photoData.traitChanged : row.photoData.trait;
			case 'condition':
				return row.condition || '';
			default:
				return '';
		}
	}, []);

	const customFilterFn = useMemo(() => createCustomFilterFn(getSearchableText), [getSearchableText]);

	const columns = useMemo<ColumnDef<DamageDataWithPhoto>[]>(() => [
		{
			accessorKey: 'name',
			header: 'フォト名',
			cell: ({ row }) => {
				if (!row.original.photoData) {
					return <div className="text-sm text-gray-400">データなし</div>;
				}

				const photoAsWithFriendOrPhoto: WithFriendOrPhoto = {
					isPhoto: true,
					photoDataRow: row.original.photoData,
					skillType: row.original.changeState === '変化後' ? 'とくせい(変化後)' : 'とくせい(変化前)'
				};
				return <FriendOrPhotoDisplay data={photoAsWithFriendOrPhoto} />;
			},
			filterFn: customFilterFn,
			meta: {
				width: '250px'
			}
		},
		{
			accessorKey: 'trait',
			header: 'とくせい',
			cell: ({ row }) => <TraitCell data={row.original} />,
			filterFn: customFilterFn,
			meta: {
				width: '400px'
			}
		},
		{
			accessorKey: 'condition',
			header: '条件',
			cell: ({ row }) => <ConditionCell data={row.original} />,
			filterFn: customFilterFn,
			meta: {
				width: '200px'
			}
		},
		{
			accessorFn: (row) => row.calculatedPower['Lv1'],
			id: 'power_lv1',
			header: () => <div className="text-center">火力指標<br />(フォトポケLv1)</div>,
			cell: ({ row }) => <PowerCell data={row.original} calculationKey="Lv1" />,
			meta: {
				width: '150px',
				align: 'center' as const,
			}
		},
		{
			accessorFn: (row) => row.calculatedPower['Lv2'],
			id: 'power_lv2',
			header: () => <div className="text-center">火力指標<br />(フォトポケLv2)</div>,
			cell: ({ row }) => <PowerCell data={row.original} calculationKey="Lv2" />,
			meta: {
				width: '150px',
				align: 'center' as const,
			}
		},
		{
			accessorFn: (row) => row.calculatedPower['Lv3'],
			id: 'power_lv3',
			header: () => <div className="text-center">火力指標<br />(フォトポケLv3)</div>,
			cell: ({ row }) => <PowerCell data={row.original} calculationKey="Lv3" />,
			meta: {
				width: '150px',
				align: 'center' as const,
			}
		},
	], [customFilterFn]);

	const handleAttributeChange = (attribute: string) => {
		setSelectedAttributes(prev => {
			const newSet = new Set(prev);
			const photoAttr = attribute as PhotoAttribute;
			if (newSet.has(photoAttr)) {
				newSet.delete(photoAttr);
			} else {
				newSet.add(photoAttr);
			}
			return newSet;
		});
	};

	const handleRarityChange = (rarity: string) => {
		setSelectedRarities(prev => {
			const newSet = new Set(prev);
			const rarityNum = parseInt(rarity);
			if (newSet.has(rarityNum)) {
				newSet.delete(rarityNum);
			} else {
				newSet.add(rarityNum);
			}
			return newSet;
		});
	};

	const handleChangeStateChange = (changeState: string) => {
		setSelectedChangeStates(prev => {
			const newSet = new Set(prev);
			if (newSet.has(changeState)) {
				newSet.delete(changeState);
			} else {
				newSet.add(changeState);
			}
			return newSet;
		});
	};

	const attributeOptions: CheckboxOption[] = [PhotoAttribute.footprint, PhotoAttribute.blue]
		.map(attr => ({
			id: attr,
			label: <PhotoAttributeIcon attribute={attr} showText={false} />,
			styles: attr === PhotoAttribute.footprint ? {
				backgroundColor: {
					unchecked: "#fef3c7",
					checked: "#fde68a",
					hover: "#fcd34d",
				},
				textColor: "#FF3C60",
			} : {
				backgroundColor: {
					unchecked: "#EAEBFF",
					checked: "#D6D8FF",
					hover: "#ADB1FF",
				},
				textColor: "#613FFF",
			},
		}));

	const rarityOptions: CheckboxOption[] = [4, 3, 2].map(rarity => ({
		id: rarity.toString(),
		label: `☆${rarity}`,
		styles: {
			backgroundColor: {
				unchecked: "#fef3c7",
				checked: "#fde68a",
				hover: "#fcd34d",
			},
			textColor: "#d97706",
		},
	}));

	const changeStateOptions: CheckboxOption[] = [
		{
			id: '変化前',
			label: '変化前',
			styles: {
				backgroundColor: {
					unchecked: "#f3f4f6",
					checked: "#e5e7eb",
					hover: "#d1d5db",
				},
				textColor: "#374151",
			},
		},
		{
			id: '変化後',
			label: '変化後',
			styles: {
				backgroundColor: {
					unchecked: "#fce7f3",
					checked: "#fbcfe8",
					hover: "#f9a8d4",
				},
				textColor: "#ec4899",
			},
		}
	];

	if (!isMounted) return null;

	return (
		<>
			<div className="p-1 space-y-4 max-w-240">
				<div className="rounded-lg p-4 border border-gray-200 bg-gray-50">
					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">

					<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-700">こうげき値設定</h3>
							<FormControl variant="outlined" size="small" className="w-32">
								<Select
									value={baseAttack}
									onChange={(e) => setBaseAttack(Number(e.target.value))}
								>
									{[10000, 12500, 15000, 17500, 20000, 22500, 25000, 27500, 30000].map(value => (
										<MenuItem key={value} value={value}>{value.toLocaleString()}</MenuItem>
									))}
								</Select>
							</FormControl>
						</div>

						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-700">属性</h3>
							<FilterCheckboxGroup
								options={attributeOptions}
								selectedIds={selectedAttributes}
								onChange={handleAttributeChange}
							/>
						</div>

						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-700">状態</h3>
							<FilterCheckboxGroup
								options={changeStateOptions}
								selectedIds={selectedChangeStates}
								onChange={handleChangeStateChange}
							/>
						</div>

						<div className="space-y-2">
							<h3 className="text-sm font-medium text-gray-700">レアリティ</h3>
							<FilterCheckboxGroup
								options={rarityOptions}
								selectedIds={new Set(Array.from(selectedRarities).map(String))}
								onChange={handleRarityChange}
							/>
						</div>
					</div>
				</div>

				<Table
					data={filteredData}
					columns={columns}
					tableId="photo-damage-ranking"
					initialSorting={[{ id: 'power_lv2', desc: true }]}
					rowMinHeight="80px"
				/>
			</div>
		</>
	);
}