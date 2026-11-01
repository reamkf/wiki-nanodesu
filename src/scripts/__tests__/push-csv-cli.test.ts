import { expect, test } from "bun:test";
import {
	existsSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type Confirmation = "approve" | "cancel" | "change-csv";

// 実CLIを別プロセスで起動し、認証不要のローカルAPIだけへ接続する。
function createFixture() {
	const directory = mkdtempSync(join(tmpdir(), "sheets-cli-"));
	const stateDirectory = join(directory, "state");
	const header = [
		"イベント名",
		"開催開始",
		"リンク",
		...Array.from({ length: 12 }, (_, i) => `列${i}`),
	];
	const row = (name: string) => [
		name,
		"2026/11/01",
		`https://example.invalid/${name}`,
		...Array(12).fill(""),
	];
	const initial = [header, row("A"), row("B")];
	const remote = initial.map((values) => [...values]);
	const local = [header, row("New"), row("A"), row("B")];
	local[2][2] = "https://example.invalid/A-updated";
	let inserts = 0,
		writes = 0,
		reads = 0,
		rowCount = 50,
		failAfterInsert = false;
	const server = Bun.serve({
		hostname: "127.0.0.1",
		port: 0,
		async fetch(request) {
			if (request.method === "GET") {
				reads++;
				return Response.json({
					sheets: [
						{
							properties: {
								sheetId: 7,
								title: "イベントデータ",
								gridProperties: { rowCount },
							},
							data: [
								{
									rowData: remote.map((values) => ({
										values: values.map((value) => ({
											formattedValue: value,
											effectiveValue: { stringValue: value },
											userEnteredValue: { stringValue: value },
										})),
									})),
								},
							],
						},
					],
				});
			}
			const body = (await request.json()) as {
				requests?: {
					insertDimension?: { range: { startIndex: number; endIndex: number } };
				}[];
				data?: { range: string; values: string[][] }[];
			};
			if (new URL(request.url).pathname.endsWith(":batchUpdate") && body.requests) {
				for (const operation of body.requests) {
					if (!operation.insertDimension)
						return new Response("unexpected structural operation", { status: 400 });
					const range = operation.insertDimension.range;
					remote.splice(
						range.startIndex,
						0,
						...Array.from({ length: range.endIndex - range.startIndex }, () =>
							Array(15).fill(""),
						),
					);
					rowCount += range.endIndex - range.startIndex;
					inserts++;
					if (failAfterInsert) {
						failAfterInsert = false;
						return new Response("connection failed after insertion", { status: 503 });
					}
				}
			} else {
				for (const update of body.data ?? []) {
					const match = update.range.match(/!([A-Z]+)(\d+)$/);
					if (!match) return new Response("invalid cell range", { status: 400 });
					const column =
						[...match[1]].reduce((n, char) => n * 26 + char.charCodeAt(0) - 64, 0) - 1;
					const index = Number(match[2]) - 1;
					remote[index] ??= Array(15).fill("");
					remote[index][column] = update.values[0][0];
					writes++;
				}
			}
			return Response.json({});
		},
	});
	mkdirSync(join(directory, "csv"));
	const file = join(directory, "csv/イベントデータ.csv");
	writeFileSync(file, local.map((values) => values.join(",")).join("\n"));
	const modulePath = resolve("scripts/push-csv-to-sheets.ts");

	async function run(args: string[], confirmation?: Confirmation) {
		const confirm =
			confirmation === undefined
				? ""
				: `confirm: async () => {
					confirmations++;
					${
						confirmation === "change-csv"
							? `writeFileSync(${JSON.stringify(file)}, readFileSync(${JSON.stringify(file)}, "utf8").replace("New", "Changed"));`
							: ""
					}
					return ${confirmation !== "cancel"};
				},`;
		const script = `
			import {main} from ${JSON.stringify(modulePath)};
			import {readFileSync, writeFileSync} from "node:fs";
			let confirmations = 0;
			try {
				await main(${JSON.stringify(args)}, {
					stateDirectory: ${JSON.stringify(stateDirectory)},
					${confirm}
					request: async (suffix, body) => {
						const response = await fetch(${JSON.stringify(server.url.origin)} + "/api" + suffix, {
							method: body === undefined ? "GET" : "POST",
							headers: {"Content-Type": "application/json"},
							body: body === undefined ? undefined : JSON.stringify(body),
						});
						if (!response.ok) throw new Error("HTTP " + response.status);
						return response.json();
					},
				});
			} catch (error) {
				console.error(error);
				process.exitCode = 1;
			} finally {
				console.log("TEST_CONFIRMATIONS=" + confirmations);
			}
		`;
		const child = Bun.spawn([process.execPath, "-e", script], {
			cwd: directory,
			stdin: "ignore",
			stdout: "pipe",
			stderr: "pipe",
		});
		const [status, stdout, stderr] = await Promise.all([
			child.exited,
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
		]);
		const count = /^TEST_CONFIRMATIONS=(\d+)$/m.exec(stdout);
		expect(count, stderr).not.toBeNull();
		return { status, stdout, stderr, confirmations: Number(count![1]) };
	}

	return {
		run,
		initial,
		remote,
		local,
		file,
		stateDirectory,
		get counts() {
			return { inserts, writes, reads };
		},
		interruptAfterInsert() {
			failAfterInsert = true;
		},
		stateFiles() {
			return existsSync(stateDirectory) ? readdirSync(stateDirectory) : [];
		},
		close() {
			server.stop(true);
			rmSync(directory, { recursive: true });
		},
	};
}

test("確認のみ・取消は変更せず、承認後は既存行を保持して再実行で何もしない", async () => {
	const fixture = createFixture();
	try {
		const dryRun = await fixture.run(["イベントデータ", "--dry-run"], "approve");
		expect(dryRun.status, dryRun.stderr).toBe(0);
		expect(dryRun.confirmations).toBe(0);
		expect(dryRun.stdout).toContain("イベントデータ");
		expect(dryRun.stdout).toContain("New");
		expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
		expect(fixture.remote).toEqual(fixture.initial);
		expect(fixture.stateFiles()).toEqual([]);

		const canceled = await fixture.run(["イベントデータ"], "cancel");
		expect(canceled.status, canceled.stderr).toBe(0);
		expect(canceled.confirmations).toBe(1);
		expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
		expect(fixture.remote).toEqual(fixture.initial);
		expect(fixture.stateFiles()).toEqual([]);

		const approved = await fixture.run(["イベントデータ"], "approve");
		expect(approved.status, approved.stderr).toBe(0);
		expect(approved.confirmations).toBe(1);
		expect(fixture.remote).toEqual(fixture.local);
		expect(fixture.counts.inserts).toBe(1);
		expect(fixture.stateFiles()).toEqual([]);

		const writesBeforeRepeat = fixture.counts.writes;
		const repeated = await fixture.run(["イベントデータ"], "approve");
		expect(repeated.status, repeated.stderr).toBe(0);
		expect(repeated.confirmations).toBe(0);
		expect(fixture.remote).toEqual(fixture.local);
		expect(fixture.counts).toMatchObject({ inserts: 1, writes: writesBeforeRepeat });
		expect(fixture.stateFiles()).toEqual([]);
	} finally {
		fixture.close();
	}
});

test("非対話環境の既定確認は書き込みを拒否し、確認のみは利用できる", async () => {
	const fixture = createFixture();
	try {
		const refused = await fixture.run(["イベントデータ"]);
		expect(refused.status).not.toBe(0);
		expect(refused.confirmations).toBe(0);
		expect(fixture.remote).toEqual(fixture.initial);
		expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
		expect(fixture.stateFiles()).toEqual([]);

		const dryRun = await fixture.run(["イベントデータ", "--dry-run"]);
		expect(dryRun.status, dryRun.stderr).toBe(0);
		expect(dryRun.confirmations).toBe(0);
		expect(fixture.remote).toEqual(fixture.initial);
		expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
		expect(fixture.stateFiles()).toEqual([]);
	} finally {
		fixture.close();
	}
});

test("承認中にCSVが変わった場合は最初の書き込み前に拒否する", async () => {
	const fixture = createFixture();
	try {
		const changed = await fixture.run(["イベントデータ"], "change-csv");
		expect(changed.status).not.toBe(0);
		expect(changed.confirmations).toBe(1);
		expect(readFileSync(fixture.file, "utf8")).toContain("Changed");
		expect(fixture.remote).toEqual(fixture.initial);
		expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
	} finally {
		fixture.close();
	}
});

test("行挿入直後の通信失敗は記録を残し、次の通常実行で二重挿入せず再開する", async () => {
	const fixture = createFixture();
	try {
		fixture.interruptAfterInsert();
		const interrupted = await fixture.run(["イベントデータ"], "approve");
		expect(interrupted.status).not.toBe(0);
		expect(interrupted.confirmations).toBe(1);
		expect(fixture.counts).toMatchObject({ inserts: 1, writes: 0 });
		expect(fixture.remote).toEqual([
			fixture.initial[0],
			Array(15).fill(""),
			...fixture.initial.slice(1),
		]);
		expect(fixture.stateFiles()).toContain("pending.json");
		expect(fixture.stateFiles()).toContain("journal.json");

		const resumed = await fixture.run(["イベントデータ"], "approve");
		expect(resumed.status, resumed.stderr).toBe(0);
		expect(resumed.confirmations).toBe(1);
		expect(fixture.remote).toEqual(fixture.local);
		expect(fixture.counts.inserts).toBe(1);
		expect(fixture.stateFiles()).toEqual([]);
	} finally {
		fixture.close();
	}
});

test.each([true, false])(
	"計画なしの実行記録は完了済み=%sの場合だけ安全に片付ける",
	async (completed) => {
		const fixture = createFixture();
		try {
			writeFileSync(
				fixture.file,
				fixture.initial.map((values) => values.join(",")).join("\n"),
			);
			mkdirSync(fixture.stateDirectory);
			const journalPath = join(fixture.stateDirectory, "journal.json");
			const journal = JSON.stringify({ version: 1, completed });
			writeFileSync(journalPath, journal);

			const result = await fixture.run(["イベントデータ"], "approve");
			if (completed) {
				expect(result.status, result.stderr).toBe(0);
				expect(fixture.stateFiles()).toEqual([]);
			} else {
				expect(result.status).not.toBe(0);
				expect(readFileSync(journalPath, "utf8")).toBe(journal);
				expect(fixture.stateFiles()).toEqual(["journal.json"]);
			}
			expect(result.confirmations).toBe(0);
			expect(fixture.remote).toEqual(fixture.initial);
			expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
		} finally {
			fixture.close();
		}
	},
);

test.each(["--plan", "--apply"])("廃止した%sは変更も確認もせず拒否する", async (flag) => {
	const fixture = createFixture();
	try {
		const rejected = await fixture.run(
			["イベントデータ", flag, join(fixture.stateDirectory, "plan.json")],
			"approve",
		);
		expect(rejected.status).not.toBe(0);
		expect(rejected.confirmations).toBe(0);
		expect(fixture.remote).toEqual(fixture.initial);
		expect(fixture.counts).toMatchObject({ inserts: 0, writes: 0 });
		expect(fixture.stateFiles()).toEqual([]);
	} finally {
		fixture.close();
	}
});
