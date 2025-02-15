import { Dialog, Transition } from "@headlessui/react";
import { DialogTitle, DialogPanel, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";

interface AboutModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog as="div" className="relative z-10" onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black/25" />
				</TransitionChild>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<TransitionChild
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								<DialogTitle
									as="h1"
									className="text-lg font-extrabold leading-6 text-gray-900"
								>
									このサイトについて
								</DialogTitle>
								<div className="mt-2">
									<p className="text-base mb-2">
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
									<p className="text-sm text-gray-500 mb-2">
										Seesaa Wikiの文字数制限などの都合で、Seesaa Wiki上での運用が難しいページをこちらで運用しているのです。
									</p>
									<p className="text-sm text-gray-500">
										誤字・誤植の報告や情報提供は <Link href="https://seesaawiki.jp/kemono_friends3_5ch/" className="font-bold hover:underline text-green-500" target="_blank" rel="noopener noreferrer">アプリ版けものフレンズ３Wikiなのだ！</Link> のコメント欄または掲示板へお願いするのです。
									</p>
								</div>

								<div className="mt-4">
									<button
										type="button"
										className="inline-flex justify-center rounded-md border border-transparent bg-sky-100 px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
										onClick={onClose}
									>
										閉じる
									</button>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}