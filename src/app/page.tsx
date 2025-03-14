import { SeesaaWikiImage } from "@/components/seesaawiki/SeesaaWikiImage";
import { SeesaaWikiLink } from "@/components/seesaawiki/SeesaaWikiLink";
import { PageTitle } from "@/components/PageTitle";

export default function Home() {
	return (
		<>
			<PageTitle title="トップページ" />
			<div className="rounded-sm mb-4">
				<p className="mb-2">
					<SeesaaWikiLink href="https://seesaawiki.jp/kemono_friends3_5ch/">
						アプリ版けものフレンズ３Wikiなのだ！
					</SeesaaWikiLink>
					を補助するサイトなのです。
				</p>
				<p>
					文字数上限などの都合で、Seesaa Wiki上での運用が難しいページをこちらで運用しているのです。
				</p>

				<SeesaaWikiImage
					src="https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/qUJbC4v4sZ.jpg"
					alt="メインビジュアル"
					width={750}
					height={300}
					className="my-4"
					referrerPolicy="no-referrer"
				/>

				<p>
					誤字・誤植の報告や情報提供は
					<SeesaaWikiLink href="https://seesaawiki.jp/kemono_friends3_5ch/">
						アプリ版けものフレンズ３Wikiなのだ！
					</SeesaaWikiLink>
					のコメント欄または掲示板へお願いするのです。
				</p>
			</div>
		</>
	)
}