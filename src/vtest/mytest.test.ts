// sum.test.js
import { expect, test } from 'vitest';
//import { pdfMerge } from './pdf-merge-pdflib';
import * as common from '../common';
import path from 'node:path';

test('adds 1 + 2 to equal 3', () => {
  expect(3).toBe(3);
});


test('file exist', async () =>  {
  expect(await common.fileExists("../../demo/Book1.pdf")).toBe(false);
});

test('file exist', async () =>  {
  expect(await common.fileExists(String.raw`C:\home\githubs\pdf-merge\src\vtest\mytest.test.ts`)).toBe(true);
});

// test('file exist', async () =>  {
//   expect(path.resolve('./mytest.test.ts')).toBe('C:\home\githubs\pdf-merge\src\vtest\mytest.test.ts');
// });