import { describe, test, expect } from 'bun:test';
import { encodeEUCJP, decodeEUCJP } from '../encoding';

describe('encodeEUCJP', () => {
	test('ひらがなのエンコード・デコード', () => {
		const original = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
		const encoded = encodeEUCJP(original);
		const decoded = decodeEUCJP(encoded);
		expect(encoded).toBe('%a4%a2%a4%a4%a4%a6%a4%a8%a4%aa%a4%ab%a4%ad%a4%af%a4%b1%a4%b3%a4%b5%a4%b7%a4%b9%a4%bb%a4%bd%a4%bf%a4%c1%a4%c4%a4%c6%a4%c8%a4%ca%a4%cb%a4%cc%a4%cd%a4%ce%a4%cf%a4%d2%a4%d5%a4%d8%a4%db%a4%de%a4%df%a4%e0%a4%e1%a4%e2%a4%e4%a4%e6%a4%e8%a4%e9%a4%ea%a4%eb%a4%ec%a4%ed%a4%ef%a4%f2%a4%f3'.toLowerCase())
		expect(decoded).toBe(original);
	});

	test('アルファベットのエンコード', () => {
		const original = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		const encoded = encodeEUCJP(original);
		const decoded = decodeEUCJP(encoded);
		expect(encoded).toBe(original);
		expect(decoded).toBe(original);
	});

	test('記号のエンコード', () => {
		const original = '!@#$%^&*()_+-=[]{}|;:,.<>?/';
		const encoded = encodeEUCJP(original);
		const decoded = decodeEUCJP(encoded);
		expect(encoded).toBe('%21%40%23%24%25%5e%26%2a%28%29%5f%2b%2d%3d%5b%5d%7b%7d%7c%3b%3a%2c.%3c%3e%3f/');
		expect(decoded).toBe(original);
	});
});