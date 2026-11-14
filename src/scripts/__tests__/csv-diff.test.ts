import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(import.meta.dir, "../../../scripts/csv-diff.ts");

test("フォトデータの行ラベルはレア度ではなくフォト名を使う", () => {
	const dir = mkdtempSync(join(tmpdir(), "csv-diff-photo-"));
	const run = (command: string, ...args: string[]) =>
		execFileSync(command, args, { cwd: dir, encoding: "utf8" });
	try {
		run("git", "init", "-q");
		run("git", "config", "user.name", "Test");
		run("git", "config", "user.email", "test@example.com");
		mkdirSync(join(dir, "csv"));
		const file = join(dir, "csv", "フォトデータ.csv");
		writeFileSync(
			file,
			"レア度,フォト名,属性\n2,４番バッター・ヒグマ,足跡\n3,あなたはだぁれ？,青\n",
		);
		run("git", "add", "csv");
		run("git", "commit", "-qm", "initial");
		writeFileSync(file, "レア度,フォト名,属性\n2,４番バッター・ヒグマ,青\n");
		run("git", "add", "csv");
		const report = run("bun", script);
		expect(report).toContain(
			"| csv/フォトデータ.csv | 2行目: ４番バッター・ヒグマ | 更新 | 属性 | 足跡 | 青 |",
		);
		expect(report).toContain(
			"| csv/フォトデータ.csv | 3行目: あなたはだぁれ？ | 削除 |  |  |  |",
		);
		expect(report).not.toContain("2行目: 2");
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("既存行のセルを比較し、追加・削除行は行単位で表示する", () => {
	const dir = mkdtempSync(join(tmpdir(), "csv-diff-"));
	const run = (command: string, ...args: string[]) =>
		execFileSync(command, args, { cwd: dir, encoding: "utf8" });
	try {
		run("git", "init", "-q");
		run("git", "config", "user.name", "Test");
		run("git", "config", "user.email", "test@example.com");
		mkdirSync(join(dir, "csv"));
		const file = join(dir, "csv", "フォトデータ.csv");
		writeFileSync(file, 'フォト名,説明,値\n既存,"旧\n文",1\n削除,古い,2\n残る,同じ,3\n');
		run("git", "add", "csv");
		run("git", "commit", "-qm", "initial");
		writeFileSync(file, 'フォト名,説明,値\n追加,新規,4\n既存,"新\n<a>|&",5\n残る,同じ,3\n');
		run("git", "add", "csv");
		const report = run("bun", script);
		expect(report).toContain("| csv/フォトデータ.csv | 3行目: 既存 | 更新 | 説明 | 旧<br>文 | 新<br>&lt;a&gt;&#124;&amp; |");
		expect(report).toContain("| csv/フォトデータ.csv | 3行目: 既存 | 更新 | 値 | 1 | 5 |");
		expect(report).toContain("| csv/フォトデータ.csv | 2行目: 追加 | 追加 |  |  |  |");
		expect(report).toContain("| csv/フォトデータ.csv | 3行目: 削除 | 削除 |  |  |  |");
		expect(report).not.toContain("新規");
		writeFileSync(file, `フォト名,説明,値\n既存,${"大".repeat(30000)},1\n削除,古い,2\n残る,同じ,3\n`);
		expect(run("bun", script, "--pr-body")).toContain("表を途中で省略しました");
		expect(run("bun", script)).toContain("大".repeat(30000));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
