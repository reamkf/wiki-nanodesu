import { generateMetadata } from "../metadata";
import { getPhotoData } from "@/data/photoData";
import { getPhotoDamageData } from "@/data/photoDamageData";
import ClientPage from "./page.client";
import { PageTitle } from '@/components/PageTitle';
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import GoogleSheetsLink from "@/components/GoogleSheetsLink";
import { Heading } from "@/components/section/Heading";

export const metadata = generateMetadata({
	title: "フォト火力ランキング",
});

export default async function PhotoDamageRankingPage() {
	const photoData = await getPhotoData();
	const photoDamageData = await getPhotoDamageData();

	return (
		<div className="min-h-screen">
			<PageTitle title="フォト火力ランキング" />

			<div className="space-y-4">
				<p className="text-sm mb-4">
					フォト単体の火力の指標を計算し一覧にしたものです。<br />
					シーサーバル道場でアタッカーに持たせるフォトの優劣の判断がつきにくいときなどに参考にして下さい。
				</p>

				<p className="text-sm">
					このページのデータは下記のスプレッドシートで管理しています。
					データの修正はスプレッドシート上で行ってください。<br />
					<GoogleSheetsLink
						link="https://docs.google.com/spreadsheets/d/1p-C3wbkYZf_2Uce2J2J6w6T1V6X5eJmk-PtC4I__olk/edit?gid=803717923#gid=803717923"
					/>
				</p>
				<p className="text-sm">
					誤字・誤植の報告は
					<SeesaaWikiLink
						href="フォト火力ランキング"
					>
						こちら
					</SeesaaWikiLink>
					のコメント欄へお願いします。
				</p>

				<Heading title="事前知識" id="know-this" level={2} />
				<div className="p-2">
					<ul className="space-y-1 text-sm mb-4">
						<li>• フォトの火力を評価するには、「フォトのこうげき値」と「フォトのとくせいによる与ダメージ増加」の両方を考慮する必要がある。</li>
						<li className="ml-4">・とくせいの数字だけ見れば劣っても、こうげき値が高いことで捲るようなケースは多々ある。</li>
						<li>• <span className="font-bold text-red-500">同じフォトでも、「対象のフォトを装備する前のこうげき値の合計」と「装備するフォトポケのフォトポケLv」次第で評価が変わる。</span></li>
						<li className="ml-4">・「対象のフォトを装備する前のこうげき値の合計」=「フレンズのこうげき値」(衣装補正を含む)+「他に装備しているフォトのこうげき値」(フォトポケLv.による補正を含む)+「アクセのこうげき値」+「迷宮のこうげき値」</li>
						<li className="ml-4">・<span className="font-bold">つまり、フレンズによっても変わるし、他につけているフォトによっても変わるし、迷宮や育成状況、衣装やアクセの所持状況等によっても変わる。</span></li>
						<li>• 「対象のフォトを装備する前のこうげき値の合計」が低いほど、こうげき値の高いフォトが有利。</li>
						<li>• 「装備するフォトポケのフォトポケLv」が高いほど、こうげき値の高いフォトが有利。</li>
					</ul>
				</div>

				<Heading title="火力指標について" id="damage-indicator" level={2} />
				<div className="p-2">
					<p className="text-sm mb-2">
						フォトの火力を評価するには、「フォトのこうげき値」と「フォトのとくせいによる与ダメージ増加」の両方を考慮する必要があります。<br />
						こうげき値は加算、とくせいによる与ダメージは乗算で計算されるため、以下のようにこうげき値による増分を乗算に換算して掛け合わせたものを火力指標とします。
					</p>
					<blockquote className="border-l-4 border-gray-300 pl-4 italic text-sm mb-2">
						(対象のフォト装備後のこうげき値合計)÷(対象のフォト装備前のこうげき値合計)×(対象のフォトのとくせいによる与ダメージ増加)
					</blockquote>
					<p className="text-sm mb-2">
						この式からも分かるように、<span className="font-bold text-red-500">「装備前のこうげき値合計」と「装備するフォトポケのフォトポケLv」によって評価が変わってきます。</span><br />
						自分の状況に近いこうげき値を選択してください。
					</p>
					<p className="text-sm mb-4">
						フォトのレベルは変化後はレベル最大(☆4ならLv.70、☆3ならLv.60、☆2ならLv.50)、変化前は無凸のレベル最大(☆4ならLv.50、☆3ならLv.40、☆2ならLv.30)として計算しています。
					</p>
				</div>
			</div>

			<ClientPage photoData={photoData} photoDamageData={photoDamageData} />
		</div>
	);
}