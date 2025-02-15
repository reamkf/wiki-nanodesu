import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface AboutButtonProps {
	onClick: () => void;
}

export function AboutButton({ onClick }: AboutButtonProps) {
	return (
		<Tooltip title="このサイトについて">
			<IconButton
				onClick={onClick}
				size="large"
			>
				<HelpOutlineIcon sx={{ fontSize: 32 }} />
			</IconButton>
		</Tooltip>
	);
}