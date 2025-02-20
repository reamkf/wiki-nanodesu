// サーバーコンポーネント
import { getFriendsData } from '@/utils/friendsData';
import { SidebarClient } from './SidebarClient';
import { FriendsDataRow } from '@/types/friends';

export async function Sidebar() {
	const friendsData = await getFriendsData();
	const friendsPageNameList = friendsData.map((friend: FriendsDataRow) =>
		friend.secondName ? `【${friend.secondName}】${friend.name}` : friend.name
	);

	return <SidebarClient friendsPageNameList={friendsPageNameList} />;
}