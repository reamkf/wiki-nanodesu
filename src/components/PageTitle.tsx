export function PageTitle(props: { title: string }) {
	return (
		<h2 className="text-xl font-bold mb-4 border-b-2 border-sky-300">{props.title}</h2>
	)
}
