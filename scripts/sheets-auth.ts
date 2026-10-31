import { createReadStream } from "fs";
import { JWT } from "google-auth-library";

export async function getSheetsAccessToken(
	env: Record<string, string | undefined> = process.env,
): Promise<string> {
	if (!env.GOOGLE_APPLICATION_CREDENTIALS) {
		throw new Error("GOOGLE_APPLICATION_CREDENTIALSを設定してください。");
	}
	const auth = new JWT({
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});
	await auth.fromStream(createReadStream(env.GOOGLE_APPLICATION_CREDENTIALS));
	const { token } = await auth.getAccessToken();
	if (!token) throw new Error("サービスアカウントのアクセストークンを取得できませんでした。");
	return token;
}
