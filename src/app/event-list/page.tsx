import { generateMetadata } from "../metadata";
import { PageTitle } from "@/components/PageTitle";
import { getEventDisplayData } from "@/data/eventData";
import EventTable from "./page.client";

export const metadata = generateMetadata({
	title: "イベント一覧",
});

export default async function EventListPage() {
	const events = await getEventDisplayData();

	return (
		<div>
			<PageTitle title="イベント一覧" />
			<EventTable data={events} />
		</div>
	);
}
