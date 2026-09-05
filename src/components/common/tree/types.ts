export interface TreeItemData {
	id: string;
	name: string;
	children?: TreeItemData[];
	isExpandedByDefault?: boolean;
}

export interface VisibleTreeItem {
	item: TreeItemData;
	id: string;
	level: number;
	parentId: string | null;
	hasChildren: boolean;
	expanded: boolean;
}
