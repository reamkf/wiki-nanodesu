'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/contexts/SidebarContext';
import { getWikiNanodaPageUrl } from '@/utils/encoding';

interface SidebarClientProps {
	friendsPageNameList: string[];
}

export function SidebarClient({ friendsPageNameList }: SidebarClientProps) {
	const { isOpen, close } = useSidebar();
	const [searchQuery, setSearchQuery] = useState('');

	const sideBarLinksNanodesu = [
		{
			href: '/friends-status',
			text: 'フレンズステータスランキング',
		},
	];

	const sideBarPagesNanoda = [
		'初心者指南',
		'Ｑ＆Ａ',
		'リセマラ情報',
		'課金ガイド',
		'フォト交換券パックおすすめフォト',
		'用語集',
		'称号一覧',
		'探検隊Lvとスタミナ',
		'わいわいツリーハウス',
		'ピクニック',
		'家具',
		'シーサーバル道場・概要',
		'シーサーバル道場・基本戦術',
		'シーサーバル道場（β2-29）',
		'ちからくらべ',
		'とくべつくんれん',
		'むちゃ攻略',
		'すぺしゃるクエスト',
		'バトルの基本知識',
		'状態異常',
		'スキル効果別フレンズ一覧',
		'地形',
		'隊長スキル',
		'TIPS',
		'パーティ編成考察',
		'フレンズ一覧',
		'ファニー（赤）属性フレンズ',
		'フレンドリー（緑）属性フレンズ',
		'リラックス（青）属性フレンズ',
		'ラブリー（桃）属性フレンズ',
		'アクティブ（黄緑）属性フレンズ',
		'マイペース（水）属性フレンズ',
		'フレンズオーダー一覧表',
		'なないろとくせい一覧',
		'フレンズ上方修正一覧',
		'フレンズ掛け合い一覧',
		'フレンズCV一覧',
		'フレンズセリフ集',
		'フレンズ衣装一覧',
		'おしゃれアクセ',
		'けものミラクル一覧表',
		'フォト一覧',
		'動物フォト一覧',
		'効果別フォト早見表',
		'フォト火力ランキング',
		'フレンズ成長',
		'フォト強化',
		'成長素材入手先',
		'探検！迷宮ゾーン',
		'なかよしボーナス',
		'体力測定 ホッキョクグマ編',
		'過去のイベント',
		'イベント攻略',
		'成長クエスト',
		'フレンズストーリー',
		'ショップ',
		'過去の交換所',
		'期間限定○月しょうたい',
		'おしゃれメダル交換所',
		'リウキウおしゃれメダル交換所',
		'ちゅーばーのあかし交換所',
		'インテリアメダル交換所',
		'キラキラ交換所',
		'スターグラス交換所',
		'ラッキーメダル交換所',
		'くんれんショップ',
		'期間限定しょうたい',
		'期間限定しょうたい一覧(2021)',
		'期間限定しょうたい一覧(2020)',
		'週末すぺしゃるぴっくあっぷ',
		'すごい!!すぺしゃる10回しょうたい',
		'インテリア便',
		'キラキラ便',
		'しょうたい（ガチャ）',
		'ミッション',
		'期間限定ミッション一覧(2024)',
		'期間限定ミッション一覧(2023)',
		'期間限定ミッション一覧(2021)',
		'期間限定ミッション一覧(2020)',
		'期間限定ミッション一覧(2019)',
		'小ネタ',
		'公式動画',
		'公式お知らせあーかいぶ',
		'不具合情報一覧',
		'Wiki編集連絡用ページ',
		'Wiki編集練習用ページ',
		'仮置き場',
		'レガシー置き場',
		'てんぷら置き場',
		'未記入情報一覧',
		'情報提供場',
		...friendsPageNameList,
	];

	const sideBarLinksNanoda = sideBarPagesNanoda.map((page) => ({
		href: getWikiNanodaPageUrl(page),
		text: page,
	}));

	const filteredLinksNanodesu = sideBarLinksNanodesu.filter(link =>
		link.text.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const filteredLinksNanoda = sideBarLinksNanoda.filter(link =>
		link.text.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<aside className={`
			fixed md:sticky

			md:mr-4
			p-1 md:p-4
			m-2
			top-[63px] left-0
			z-30 md:z-auto

			w-[18rem]
			h-auto
			flex-shrink-0

			bg-[#f1f9fff4] md:bg-sky-50

			transform transition-transform duration-300 ease-in-out
			${isOpen ? 'translate-x-0' : '-translate-x-[110%] md:translate-x-0'}

			rounded-lg
		`}>
			<nav className="space-y-1 p-4 md:p-0">
				<div className="mb-4">
					<input
						type="text"
						placeholder="ページを検索..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
					/>
				</div>

				<div className="flex justify-center items-center block bg-sky-200 hover:bg-sky-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_blue.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-3 pr-1 w-[70px] h-[70px] flex-1"
					/>
					<Link
						href="/"
						className="font-bold text-sky-700 p-3 pl-1 flex-grow"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのです
					</Link>
				</div>
				<ul className="list-disc pl-6">
					{filteredLinksNanodesu.map((link) => (
						<li key={`nanodesu-${link.href}`}>
							<Link
								href={link.href}
								className="block hover:text-sky-500 rounded hover:underline mb-1"
								onClick={close}
							>
								{link.text}
							</Link>
						</li>
					))}
				</ul>
				<div className="flex justify-center items-center block bg-green-200 hover:bg-green-300 hover:underline rounded-lg mb-2 transition-colors duration-200">
					<Image
						src="/wiki-nanodesu/no_green.png"
						alt="「の」のアイコン"
						width={48}
						height={48}
						className="p-3 pr-1 w-[70px] h-[70px] flex-1"
					/>
					<Link
						href="https://seesaawiki.jp/kemono_friends3_5ch/"
						className="font-bold text-green-700 p-3 pl-1 flex-grow"
						target="_blank"
						rel="noopener noreferrer"
						onClick={close}
					>
						アプリ版けものフレンズ３wikiなのだ！
					</Link>
				</div>
				<ul className="list-disc pl-6">
					{filteredLinksNanoda.map((link) => (
						<li key={`nanoda-${link.href}`}>
							<Link
								href={link.href}
								className="block hover:text-sky-500 rounded hover:underline mb-1"
								onClick={close}
								target="_blank"
								rel="noopener noreferrer"
							>
								{link.text}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	);
}