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
				className=""
			>
				<HelpOutlineIcon sx={{ fontSize: 32 }} className="text-sky-500" />
			</IconButton>
		</Tooltip>
	);
}