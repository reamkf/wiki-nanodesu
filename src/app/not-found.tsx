import Link from "next/link"

export default function NotFound() {
	return (
		<div className="min-h-screen flex justify-center pt-16">
			<div className="text-center space-y-6">
				<h2 className="text-3xl font-semibold">
					ページが見つかりません
				</h2>
				<p className="text-gray-600 dark:text-gray-400">
					お探しのページは存在しないか、移動または削除された可能性があります。
				</p>
				<div className="mt-8">
					<Link
						href="/"
						className="inline-block px-6 py-3 text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors duration-200"
					>
						トップに戻る
					</Link>
				</div>
			</div>
		</div>
	)
}