import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<>
			<h2 className="text-xl font-bold mb-4 border-b-2 border-sky-300">トップページ</h2>
			<div className="rounded mb-4">
				<p className="mb-2">
					<Link
						href="https://seesaawiki.jp/kemono_friends3_5ch/"
						className="font-bold hover:underline text-green-500"
						target="_blank"
						rel="noopener noreferrer"
					>
						アプリ版けものフレンズ３Wikiなのだ！
					</Link>
					を補助するサイトなのです。
				</p>
				<p>
					Seesaa Wikiの文字数制限などの都合で、Seesaa Wiki上での運用が難しいページをこちらで運用しているのです。
				</p>

				<Image
					src="https://image02.seesaawiki.jp/k/h/kemono_friends3_5ch/qUJbC4v4sZ.jpg"
					alt="メインビジュアル"
					width={750}
					height={300}
					className="my-4"
				/>

				<p>
					誤字・誤植の報告や情報提供は <Link href="https://seesaawiki.jp/kemono_friends3_5ch/" className="font-bold hover:underline text-green-500" target="_blank" rel="noopener noreferrer">アプリ版けものフレンズ３Wikiなのだ！</Link> のコメント欄または掲示板へお願いするのです。
				</p>
			</div>
		</>
	)
}