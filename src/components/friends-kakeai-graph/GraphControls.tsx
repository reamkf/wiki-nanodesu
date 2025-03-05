'use client';

import React, { useState } from 'react';
import { FriendNode } from '@/types/friends-kakeai-graph';
import { Autocomplete, TextField, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Image from 'next/image';

interface GraphControlsProps {
	nodes: FriendNode[];
	onSelectFriend: (friendId: string) => void;
}

const GraphControls: React.FC<GraphControlsProps> = ({ nodes, onSelectFriend }) => {
	const [selectedFriend, setSelectedFriend] = useState<FriendNode | null>(null);

	const handleFriendChange = (_event: React.SyntheticEvent, friend: FriendNode | null) => {
		setSelectedFriend(friend);
		if (friend) {
			onSelectFriend(friend.id);
		}
	};

	return (
		<Paper
			elevation={2}
			className="p-4 mb-4 w-full max-w-md rounded-lg"
		>
			<div className="flex flex-col">
				<h3 className="text-lg font-medium mb-4">フレンズ検索</h3>
				<Autocomplete
					id="friend-search"
					options={nodes}
					getOptionLabel={(option) => `${option.name}`}
					value={selectedFriend}
					onChange={handleFriendChange}
					renderInput={(params) => (
						<TextField
							{...params}
							label="フレンズを検索"
							variant="outlined"
							size="small"
							fullWidth
							InputProps={{
								...params.InputProps,
								startAdornment: (
									<>
										<SearchIcon color="action" fontSize="small" className="mr-2" />
										{params.InputProps.startAdornment}
									</>
								),
							}}
						/>
					)}
					renderOption={(props, option) => (
						<li {...props} className="flex items-center p-2">
							<div className="flex items-center space-x-2">
								{option.iconUrl && (
									<Image
										src={option.iconUrl}
										alt={option.name}
										width={24}
										height={24}
										className="rounded-full"
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											target.src = `/images/placeholder.png`;
										}}
									/>
								)}
								<span>{option.name}</span>
							</div>
						</li>
					)}
				/>
			</div>
		</Paper>
	);
};

export default GraphControls;