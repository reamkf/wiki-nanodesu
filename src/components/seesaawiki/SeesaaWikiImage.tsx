import Image, { ImageProps }from "next/image";

export function SeesaaWikiImage(props: ImageProps) {
	return (
		<Image
			src={props.src}
			alt={props.alt}
			width={props.width}
			height={props.height}
			className={props.className}
			referrerPolicy="no-referrer"
		/>
	)
}
