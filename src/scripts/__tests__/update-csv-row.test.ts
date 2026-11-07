import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("対象セルだけを更新し、他の書式と複数行セルを保持する", async () => {
	const dir = mkdtempSync(join(tmpdir(), "csv-update-"));
	try {
		const file = join(dir, "data.csv");
		const source = '\uFEFFID,開始,本文,別\r\nA,01,"改行\r\nあり","維持"\r\nA,02,元,\r\n';
		writeFileSync(file, source);
		const run = async (key: string, set: string, write = false) => {
			const p = Bun.spawn(
				[
					process.execPath,
					resolve("scripts/update-csv-row.ts"),
					"--file",
					file,
					"--key",
					key,
					"--set",
					set,
					...(write ? ["--write"] : []),
				],
				{ stdout: "pipe", stderr: "pipe" },
			);
			return { status: await p.exited, stdout: await new Response(p.stdout).text() };
		};
		const key = '{"ID":"A","開始":"01"}';
		const set = JSON.stringify({ 本文: '新,"値"\n次', 別: "" });
		const preview = await run(key, set);
		expect(preview.status).toBe(0);
		expect(JSON.parse(preview.stdout).changes).toHaveLength(2);
		expect(readFileSync(file, "utf8")).toBe(source);
		expect((await run(key, set, true)).status).toBe(0);
		expect(readFileSync(file, "utf8")).toBe(
			'\uFEFFID,開始,本文,別\r\nA,01,"新,""値""\n次",\r\nA,02,元,\r\n',
		);
		const updated = readFileSync(file, "utf8");
		for (const [badKey, badSet] of [
			['{"ID":"A"}', '{"本文":"x"}'],
			['{"ID":"missing"}', '{"本文":"x"}'],
			[key, '{"未知":"x"}'],
			[key, '{"本文":1}'],
		]) {
			expect((await run(badKey, badSet, true)).status).not.toBe(0);
			expect(readFileSync(file, "utf8")).toBe(updated);
		}
	} finally {
		rmSync(dir, { recursive: true });
	}
});
