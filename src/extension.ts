// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as vscodeCommon from "./common-vscode";
import { MessageType } from './common';
// import { modalDialogShow } from './common-vscode';
import { pdfMergeMain } from './merge-main';
import { modalDialogShow } from './common-vscode';


// for cancel spawn
let ac = new AbortController();

function resetAbortController() {
  try {
    ac.abort();
  }
  finally {
    ac = new AbortController();
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "merge-pdf" is now active!');
  vscodeCommon.showMessage(
    MessageType.info,
    '"merge-pdf" is now active!',
    "main"
  );
  // vscode.window.showInformationMessage('Congratulations, your extension "merge-pdf" is now active!');
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  // let disposable = vscode.commands.registerCommand('merge-pdf.merge', async () => {
  //   vscode.window.showInformationMessage('Hello World from merge-pdf!');
  //   await mergePdf();
  // });
  // context.subscriptions.push(disposable);

  // test pdftk
  const _path = await vscodeCommon.getPdfTkPath();

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "merge-pdf.merge",
      mergePdfWithBookmark
    )
    ,
    vscode.commands.registerTextEditorCommand(
      "merge-pdf.merge_no_bookmark",
      mergePdfNoBookmark
    )
    ,
    vscode.commands.registerTextEditorCommand(
      "merge-pdf.merge_abort",
      mergePdfAbort
    )
  );
}

async function mergePdfWithBookmark(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
) {
  await mergePdfMain(textEditor, edit, true);
}

async function mergePdfNoBookmark(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
) {
  await mergePdfMain(textEditor, edit, false);
}

async function mergePdfAbort(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
) {
  try {
    const r = await modalDialogShow("do you abort?");
    if (r) {
      ac.abort();
      vscodeCommon.updateStatusBar(false);
    }
  }
  catch (error) {
    vscodeCommon.showMessage(MessageType.err, error, "main");
  }
}

/**
 * Merge pdf files on a editor.
 * @param textEditor
 * @param edit
 * @returns
 */
async function mergePdfMain(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  withBookmark: boolean
) {

  try {
    vscodeCommon.updateStatusBar(true);
    await mergePdfFromEditor(textEditor, edit, withBookmark);
  } catch (error) {
    vscodeCommon.showMessage(MessageType.err, error, "main");
  } finally {
    vscodeCommon.updateStatusBar(false);
  }
}

/**
 * Merge pdf files on a editor.
 * @param textEditor
 * @param edit
 * @returns
 */
async function mergePdfFromEditor(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  withBookmark: boolean
) {

  const filePath = textEditor.document.uri.fsPath;
  if (!/\.pdfm.*$/i.test(filePath)) {
    return;
  }

  const isBookMark = withBookmark && !!(await vscodeCommon.getPdfTkPath());
  const bookmark = isBookMark ? "with bookmark" : "no bookmark";

  vscodeCommon.outputTab.show();
  vscodeCommon.showMessage(
    MessageType.info, `===================> start merge pdfs ${bookmark}`,
    "main"
  );
  resetAbortController();

  try {

    const textLines = textEditor.document.getText().split(/\r?\n/i);
    await pdfMergeMain(filePath, textLines, isBookMark, ac);
    vscodeCommon.showMessage(
      MessageType.info,
      `complete merge pdfs in ${filePath}`,
      "main",
      true
    );
  } catch (error) {
    vscodeCommon.showMessage(MessageType.err, error, "");
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  try {
    ac.abort();
  }
  catch {
    // do nothing
  }
}
