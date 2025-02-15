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
				sx={{
					color: 'rgb(14 165 233)', // sky-500に相当
					'&:hover': {
						backgroundColor: 'rgba(14, 165, 233, 0.04)'
					}
				}}
			>
				<HelpOutlineIcon sx={{ fontSize: 32 }} />
			</IconButton>
		</Tooltip>
	);
}