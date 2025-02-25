import React from 'react';
import { Typography, Box, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface SkillHeadingProps {
	title: string;
	isExpanded: boolean;
	onToggle: () => void;
	id?: string;
}

/**
 * スキル見出しコンポーネント
 * クリックで開閉できる見出しを表示
 */
export function SkillHeading({ title, isExpanded, onToggle, id }: SkillHeadingProps) {
	return (
		<Box
			id={id}
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				mt: 4,
				pb: 1,
				borderBottom: '1px solid #eaeaea',
				cursor: 'pointer'
			}}
			onClick={onToggle}
		>
			<Typography variant="h4" component="h2" gutterBottom sx={{ m: 0 }}>
				{title}
			</Typography>
			<IconButton size="small">
				{isExpanded ? <ExpandLess /> : <ExpandMore />}
			</IconButton>
		</Box>
	);
}
