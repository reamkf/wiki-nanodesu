import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface AboutButtonProps {
	onClick: () => void;
}

export function AboutButton({ onClick }: AboutButtonProps) {
	return (
		<Tooltip title="このサイトについて">
			<IconButton
				onClick={onClick}
				className="aspect-square"
			>
				<HelpOutlineIcon className="text-sky-500 text-3xl md:text-2xl" />
			</IconButton>
		</Tooltip>
	);
}