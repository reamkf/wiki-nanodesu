'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Redirect from '@/components/Redirect';
import { getWikiNanodaPageUrl } from '@/utils/seesaaWiki';

/**
 * wikiなのだへのリダイレクトページ
 * クエリパラメータで指定されたページ名のwikiなのだページへリダイレクト
 * 使用例: /redirect/nanoda?q=ウミネコ
 */

// クライアントサイドのロジックを含むコンポーネント
function WikiNanodaRedirectContent() {
	// クエリパラメータを取得
	const searchParams = useSearchParams();
	const pageName = searchParams.get('q') || '';

	// wikiなのだのURLを取得
	const wikiUrl = getWikiNanodaPageUrl(pageName);

	// ページ名が指定されていない場合はwikiなのだのトップページへリダイレクト
	const redirectUrl = pageName ? wikiUrl : 'https://seesaawiki.jp/kemono_friends3_5ch/';
	const message = pageName
		? `wikiなのだの「${pageName}」ページへ移動しています...`
		: 'wikiなのだのトップページへ移動しています...';

	return (
		<Redirect
			to={redirectUrl}
			message={message}
		/>
	);
}

export default function WikiNanodaRedirectPage() {
	return (
		<Suspense fallback={<div>読み込み中...</div>}>
			<WikiNanodaRedirectContent />
		</Suspense>
	);
}