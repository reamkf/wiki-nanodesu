import { getSkillsData, getEffectTypes } from "@/utils/skillsData";
import { Typography } from "@mui/material";
import ClientTabs from "./client-components";

// CSV内の「~~」を改行に変換する関数
function formatText(text: string): React.ReactElement {
	const parts = text.split('~~');

	return (
		<>
			{parts.map((part, index) => (
				<span key={index}>
					{part}
					{index < parts.length - 1 && <br />}
				</span>
			))}
		</>
	);
}

export default async function FriendsSkillsPage() {
	// すべてのスキルデータを取得
	const skillsData = await getSkillsData();
	// 効果種別の一覧を取得
	const effectTypes = await getEffectTypes();

	return (
		<div className="min-h-screen p-4">
			<Typography variant="h4" component="h1" className="mb-6">
				スキル別フレンズ一覧
			</Typography>

			<ClientTabs effectTypes={effectTypes} skillsData={skillsData} />
		</div>
	);
}

// クライアントコンポーネント
"use client";
// @ts-ignore
function ClientTabs({ effectTypes, skillsData }: { effectTypes: string[], skillsData: SkillEffect[] }) {
	const [selectedTab, setSelectedTab] = useState(0);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setSelectedTab(newValue);
	};

	return (
		<>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs
					value={selectedTab}
					onChange={handleTabChange}
					variant="scrollable"
					scrollButtons="auto"
					aria-label="効果種別タブ"
				>
					{effectTypes.map((effectType, index) => (
						<Tab key={index} label={effectType} />
					))}
				</Tabs>
			</Box>

			{effectTypes.map((effectType, index) => (
				<TabPanel key={index} value={selectedTab} index={index}>
					<SkillTable skills={skillsData.filter(skill => skill.effectType === effectType)} />
				</TabPanel>
			))}
		</>
	);
}

function TabPanel(props: { children: React.ReactNode, value: number, index: number }) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`effect-tabpanel-${index}`}
			aria-labelledby={`effect-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box>
					{children}
				</Box>
			)}
		</div>
	);
}

function SkillTable({ skills }: { skills: SkillEffect[] }) {
	return (
		<TableContainer component={Paper} className="mb-6">
			<Table sx={{ minWidth: 650 }} aria-label="スキルテーブル">
				<TableHead>
					<TableRow>
						<TableCell>フレンズID</TableCell>
						<TableCell>わざ種別</TableCell>
						<TableCell>威力</TableCell>
						<TableCell>対象</TableCell>
						<TableCell>条件</TableCell>
						<TableCell>効果ターン</TableCell>
						<TableCell>発動率</TableCell>
						<TableCell>発動回数</TableCell>
						<TableCell>備考</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{skills.map((skill, index) => (
						<TableRow key={index}>
							<TableCell>{skill.friendsId}</TableCell>
							<TableCell>{skill.skillType}</TableCell>
							<TableCell>{skill.power}</TableCell>
							<TableCell>{formatText(skill.target)}</TableCell>
							<TableCell>{formatText(skill.condition)}</TableCell>
							<TableCell>{skill.effectTurn}</TableCell>
							<TableCell>{skill.activationRate}</TableCell>
							<TableCell>{skill.activationCount}</TableCell>
							<TableCell>{skill.note}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}