import Image, { ImageProps }from "next/image";

export function SeesaaWikiImage(props: ImageProps) {
	return (
		<Image
			src={props.src || 'https://image01.seesaawiki.jp/k/h/kemono_friends3_5ch/hokQFI6JEh.png'}
			alt={props.alt}
			width={props.width}
			height={props.height}
			className={props.className}
			referrerPolicy="no-referrer"
			loading="lazy"
		/>
	)
}
