'use client';

import { useEffect } from 'react';
import { Box, Typography, CircularProgress, Link } from '@mui/material';

interface RedirectProps {
	/**
	 * リダイレクト先のURL
	 */
	to: string;
	/**
	 * リダイレクト前に表示するメッセージ
	 * @default 'リダイレクト中...'
	 */
	message?: string;
}

/**
 * 指定したURLへ即時に自動的にリダイレクトするコンポーネント
 * SSG環境でも動作するようにクライアントサイドで実装
 */
export default function Redirect({ to, message = 'リダイレクト中...' }: RedirectProps) {
	useEffect(() => {
		// 即時リダイレクト実行
		window.location.href = to;
	}, [to]);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 2,
				p: 4,
				textAlign: 'center',
			}}
		>
			<CircularProgress size={40} />
			<Typography variant="h6">{message}</Typography>
			<Typography variant="body2">
				自動的に移動しない場合は
				<Link href={to} onClick={(e) => {
					e.preventDefault();
					window.location.href = to;
				}}>
					こちら
				</Link>
				をクリックしてください
			</Typography>
		</Box>
	);
}