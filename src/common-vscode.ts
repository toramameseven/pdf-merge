import * as vscode from "vscode";
import { MessageType, fileExists } from "./common";

export const extensionName = "pdf-merge";
export const extensionNameShort = "pdf-merge";
export const outputTab = vscode.window.createOutputChannel(extensionName);

export const codeStatusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
codeStatusBar.command = "merge-pdf.merge_abort";

function createMessage(message: string | unknown, source: string) {
  if (message instanceof Error) {
    return source + " : " + message.message;
  } else if (typeof message === "string") {
    return source + " : " + message;
  }
  return "create message error.";
}

export function showMessage(
  msgType: MessageType,
  message: unknown,
  source: string,
  showNotification?: boolean
) {
  let msgString = 'Error';
  let msgFunction = vscode.window.showErrorMessage;
  switch (msgType) {
    case MessageType.info: {
      msgString = 'Info';
      msgFunction = vscode.window.showInformationMessage;
      break;
    }
    case MessageType.warn: {
      msgString = 'Warn';
      msgFunction = vscode.window.showWarningMessage;
      break;
    }
    // case MessageType.err:
    default:
  }

  const messageOut = `[${msgString}   - ${new Date().toLocaleTimeString()}] ${createMessage(
    message,
    source
  )}`;

  outputTab.appendLine(messageOut.trim());
  if (showNotification) {
    msgFunction(messageOut);
  }
}


export async function modalDialogShow(message: string, returnValue?: boolean) {
  if (returnValue !== undefined) {
    return returnValue;
  }
  const ans = await vscode.window.showInformationMessage(
    message,
    { modal: true },
    { title: "No", isCloseAffordance: true, dialogValue: false },
    { title: "Yes", isCloseAffordance: false, dialogValue: true }
  );
  return ans?.dialogValue ?? false;
}


export function updateStatusBar(isRunning: boolean): void {
  // pdf-merge.isRunning is used in package.json. set menu on or off.
  vscode.commands.executeCommand(
    "setContext",
    "pdf-merge.isRunning",
    isRunning
  );
  if (isRunning) {
    codeStatusBar.text = `$(sync~spin) ${extensionNameShort}`;
    codeStatusBar.show();
    return;
  }
  codeStatusBar.hide();
}

export async function getPdfTkPath() {
  let pdfTkPath =
    vscode.workspace
      .getConfiguration("merge-pdf")
      .get<string>("pdftk") ?? "";
  let existsPdftk = false;
  if (pdfTkPath && await fileExists(pdfTkPath) && /\.exe$/i.test(pdfTkPath)) {
    existsPdftk = true;
  } else {
    pdfTkPath = "";
  }
  vscode.commands.executeCommand(
    "setContext",
    "pdf-merge.pdftk-exists",
    existsPdftk
  );
  return pdfTkPath;
}

export function getPdfTkTimeout() {
  let pdfTkTimeOut =
    vscode.workspace
      .getConfiguration("merge-pdf")
      .get<number>("pdftk-timeout") ?? 60_000;

  if (pdfTkTimeOut < 10_000) {
    pdfTkTimeOut = 1000;
  }
  if (pdfTkTimeOut > 300_000) {
    pdfTkTimeOut = 300_000;
  }
  return pdfTkTimeOut;
}
