import { SidebarClient } from './Sidebar.client';
import { getFriendsData } from '@/data/friendsData';
import { FriendsDataRow } from '@/types/friends';
import { getPhotoData } from '@/data/photoData';
import { getWikiNanodaPageUrl } from '@/utils/seesaawiki/encoding';
import { getCurrentSeasonCount } from '@/utils/dojoSeason';

export interface SidebarLinkItem {
	href: string;
	text: string;
}

export async function Sidebar() {
	const friendsData = await getFriendsData();
	const friendsPageNameList: string[] = friendsData
		.sort(
			(a, b) => a.name.localeCompare(b.name)
		)
		.map((friend: FriendsDataRow) =>
			friend.secondName ? `【${friend.secondName}】${friend.name}` : friend.name
		);

	const photoData = await getPhotoData();

	const photoPageNameList: string[] = photoData
		.filter(photo => !photo.isWildPhoto)
		.map((photo) => photo.name)
		.sort((a, b) => a.localeCompare(b));
		// .concat(
		// 	friendsData
		// 		.filter(friend => !isHc(friend))
		// 		.map((friend) => (friend.secondName ? `【${friend.secondName}】${friend.name}` : friend.name) + '(フォト)')
		// ).sort((a, b) => a.replace(/^【.*】/, '').localeCompare(b.replace(/^【.*】/, '')));

	const sideBarLinksNanodesu: SidebarLinkItem[] = [
		{
			href: '/abnormal-status-skills',
			text: '状態異常スキル一覧',
		},
		{
			href: '/friends-skills',
			text: 'スキル別フレンズ一覧',
		},
		{
			href: '/friends-status',
			text: 'フレンズステータスランキング',
		},
		{
			href: '/friends-kakeai-graph',
			text: 'フレンズ掛け合いグラフ',
		},
		{
			href: '/photo-damage-ranking',
			text: 'フォト火力ランキング',
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
		`シーサーバル道場（β2-${getCurrentSeasonCount()}）`,
		'ちからくらべ',
		'とくべつくんれん',
		'むちゃ攻略',
		'すぺしゃるクエスト',
		'バトルの基本知識',
		'状態異常',
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
		'情報提供場'
	];

	const sideBarLinksNanoda: SidebarLinkItem[] = sideBarPagesNanoda.map((page) => ({
		href: getWikiNanodaPageUrl(page),
		text: page,
	}));

	const friendsLinks: SidebarLinkItem[] = friendsPageNameList.map((page) => ({
		href: getWikiNanodaPageUrl(page),
		text: page,
	}));

	const photoLinks: SidebarLinkItem[] = photoPageNameList.map((name) => ({
		href: getWikiNanodaPageUrl(name),
		text: name,
	}));

	return <SidebarClient
		sideBarLinksNanodesu={sideBarLinksNanodesu}
		sideBarLinksNanoda={sideBarLinksNanoda}
		friendsLinks={friendsLinks}
		photoLinks={photoLinks}
	/>;
}
