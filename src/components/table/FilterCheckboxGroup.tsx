"use client";

import React from "react";
import { FormGroup, FormControlLabel, Checkbox, Grid2 } from "@mui/material";

export interface CheckboxOption {
	id: string;
	label: React.ReactNode;
	styles: {
		backgroundColor: {
			unchecked: string;
			checked: string;
			hover: string;
		};
		textColor: string;
	};
}

interface FilterCheckboxGroupProps {
	options: CheckboxOption[];
	selectedIds: Set<string>;
	onChange: (id: string) => void;
}

export function FilterCheckboxGroup({
	options,
	selectedIds,
	onChange,
}: FilterCheckboxGroupProps) {
	return (
		<FormGroup>
			<Grid2 container spacing={1.3}>
				{options.map((option) => (
					<Grid2 key={option.id}>
						<FormControlLabel
							className="w-fit rounded-md m-0 transition-colors duration-200"
							sx={{
								backgroundColor: selectedIds.has(option.id)
									? option.styles.backgroundColor.checked
									: option.styles.backgroundColor.unchecked,
								"&:hover": {
									backgroundColor: option.styles.backgroundColor.hover,
								},
								"& .MuiFormControlLabel-label": {
									flex: 1,
								},
							}}
							control={
								<Checkbox
									checked={selectedIds.has(option.id)}
									onChange={() => onChange(option.id)}
									className="p-1 pr-0"
									sx={{
										color: option.styles.textColor,
										"&.Mui-checked": {
											color: option.styles.textColor,
										}
									}}
								/>
							}
							label={<div className="text-base p-1">{option.label}</div>}
						/>
					</Grid2>
				))}
			</Grid2>
		</FormGroup>
	);
}
