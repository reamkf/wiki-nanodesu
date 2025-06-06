import { readFileSync } from 'fs';
import { join } from 'path';
import Papa, { ParseConfig, ParseResult } from 'papaparse';

/**
 * CSVファイルを読み込み、パースして結果を返す汎用関数
 * @param fileName 読み込むCSVファイル名 (例: 'フレンズデータ.csv')
 * @param parseOptions Papa.parseに渡すオプション (header, dynamicTyping, skipEmptyLines はデフォルトでtrue)
 * @param onComplete Papa.parseのcompleteコールバック。ここで型変換などを行う
 * @returns パースおよび変換後のデータ配列のPromise
 */
export function readCsv<TRaw extends Record<string, unknown>, TResult>(
	fileName: string,
	parseOptions: Omit<ParseConfig<TRaw>, 'complete' | 'header' | 'dynamicTyping' | 'skipEmptyLines'>,
	onComplete: (data: TRaw[]) => Promise<TResult[]> | TResult[]
): Promise<TResult[]> {
	const csvPath = join(process.cwd(), 'csv', fileName);
	const csvFile = readFileSync(csvPath, 'utf-8');

	return new Promise<TResult[]>((resolve, reject) => {
		Papa.parse<TRaw>(csvFile, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			...parseOptions,
			complete: async (results: ParseResult<TRaw>) => {
				if (results.errors.length > 0) {
					console.error(`Error parsing CSV file ${fileName}:`, results.errors);
					return reject(new Error(results.errors[0].message || 'Unknown parsing error'));
				}
				try {
					const processedData = await onComplete(results.data);
					resolve(processedData);
				} catch (error) {
					console.error(`Error processing CSV data for ${fileName}:`, error);
					reject(error);
				}
			},
			error: (error: Error) => {
				console.error(`Papa.parse failed for ${fileName}:`, error.message);
				reject(error);
			},
		});
	});
}