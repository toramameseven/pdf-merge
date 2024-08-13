import path from 'node:path';
import { promises as fs } from 'node:fs';
import crypto from "node:crypto";
import { PDFDocument, PDFPage } from 'pdf-lib';

import { fileExists, rmFileIfExist, cmdSpawn, MessageType } from './common';
import { getPdfTkPath, getPdfTkTimeout, showMessage } from "./common-vscode";



export async function pdfMergeMain(settingsFile: string, textLines: string[], withBookmark: boolean, ac: AbortController) {
  const folder = path.dirname(settingsFile);
  const pdfFullPathFiles: string[] = [];
  for (let textLine of textLines) {
    const info = textLine.split("|");
    let fileName = info?.[0].trim() ?? "";

    if (fileName === "") {
      continue;
    }
    const fileNameFullPath = path.resolve(folder, fileName);
    if (!/\.pdf$/i.test(fileNameFullPath)){
      continue;
    }

    if (await fileExists(fileNameFullPath)) {
      const bookmark = info.length === 1 ? path.basename(fileNameFullPath) : info[1].trim();
      pdfFullPathFiles.push(fileNameFullPath + "|" + bookmark);
    } else {
      showMessage(MessageType.warn, `${fileNameFullPath} does not exist.!!`, "merge-main", false);
    }
  }

  const pdfMergedFullPath = settingsFile + ".pdf";

  const uuid = crypto.randomUUID();
  const tocFile = uuid + "merge.toc";
  const pdfBeforeToc = uuid + "merge.toc.pdf";

  await pdfMerge(pdfMergedFullPath, pdfFullPathFiles, tocFile, pdfBeforeToc, withBookmark);
  await pdfAddBookmarkIfNeed(pdfMergedFullPath, tocFile, pdfBeforeToc, ac);
}


type pageInfo = { title: string, pageCount: number };
type pageInfos = pageInfo[];


/**
 * merge pdf and create toc
 * @param pdfMergedFullPath
 * @param pdfFilesFullPath 
 * @param tocFile 
 * @param pdfBeforeToc 
 * @param withBookmark 
 */
async function pdfMerge(pdfMergedFullPath: string, pdfFilesFullPath: string[], tocFile: string, pdfBeforeToc: string, withBookmark: boolean) {
  const mergedPdf = await PDFDocument.create();
  const pageInfos = [];

  for (let pdf of pdfFilesFullPath) {

    const pdfInfo = pdf.split("|");
    const pdfPath = pdfInfo[0];
    const bookmarkTitle = pdfInfo[1];

    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDocument = await PDFDocument.load(pdfBytes);


    const pageCount = pdfDocument.getPageCount();
    pageInfos.push({ title: bookmarkTitle, pageCount });


    const copiedPages = await mergedPdf.copyPages(pdfDocument, pdfDocument.getPageIndices());
    for (const page of copiedPages){
      mergedPdf.addPage(page);
    }
  }

  // create toc information
  const tocInfo: string[] = [];
  let pageCount = 1;
  for (let info of pageInfos) {
    if (info.title) {
      tocInfo.push(`BookmarkBegin`, `BookmarkTitle: ${info.title}`, `BookmarkLevel: 1`, `BookmarkPageNumber: ${pageCount}`);
    }
    pageCount += info.pageCount;
  }

  let saveFullPath = pdfMergedFullPath;
  // save toc info
  if (tocInfo.length > 0 && withBookmark) {
    const workingFolder = path.dirname(pdfMergedFullPath);
    await fs.writeFile(path.resolve(workingFolder, tocFile), tocInfo.join("\n"));
    saveFullPath = path.resolve(workingFolder, pdfBeforeToc);
  }

  // save merged pdf
  const pdfMergedBytes = await mergedPdf.save();
  await fs.writeFile(saveFullPath, pdfMergedBytes);
}

/**
 * add bookmark with pdftk
 * @param pdfAddBookmarkFullPath 
 * @param tocFile 
 * @param pdfBeforeToc 
 * @param ac 
 */
async function pdfAddBookmarkIfNeed(pdfAddBookmarkFullPath: string, tocFile: string, pdfBeforeToc: string, ac: AbortController) {
  // pdftk pdf.pdf update_info_utf8 bookmark.toc output OUTPUT.pdf

  const exe = await (getPdfTkPath());
  const timeout = getPdfTkTimeout();
  const workingFolder = path.dirname(pdfAddBookmarkFullPath);
  const tocFilePath = path.resolve(workingFolder, tocFile);
  const pdfToAddBookmark = path.resolve(workingFolder, pdfBeforeToc);

  if (await fileExists(pdfToAddBookmark) && await fileExists(tocFilePath)) {
    await cmdSpawn(exe, [pdfToAddBookmark, "update_info_utf8", tocFile, "output", pdfAddBookmarkFullPath], workingFolder, timeout, ac, showMessage);
  }

  await rmFileIfExist(tocFilePath, { force: true });
  await rmFileIfExist(pdfToAddBookmark, { force: true });
}

// for bookmark

// BookmarkBegin
// BookmarkTitle: タイトル1
// BookmarkLevel: 1
// BookmarkPageNumber: 1

// BookmarkBegin
// BookmarkTitle: タイトル1-2
// BookmarkLevel: 2
// BookmarkPageNumber: 3
