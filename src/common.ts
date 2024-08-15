import path = require("path");
import * as Fs from "node:fs";
// import Encoding = require("encoding-japanese");
import * as fs from "node:fs";
import * as iconv from "iconv-lite";
import { spawn } from "node:child_process";


export const MessageType = {
  info: "info",
  warn: "warn",
  err: "err",
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export type ShowMessage = (
  messageType: MessageType,
  message: unknown,
  source: string,
  showNotification?: boolean
) => void;

export type UpdateStatusBar = (isRunning: boolean) => void;

// export function getFileContents(filePath: string) {
//   const outLines: string[] = [];
//   const dirPath = path.dirname(filePath);
//   const buffer = Fs.readFileSync(filePath);
//   let fileContents = Encoding.convert(buffer, {
//     to: "UNICODE",
//     type: "string",
//   });
//   // bom
//   if (fileContents.charCodeAt(0) === 0xfeff) {
//     fileContents = fileContents.substring(1);
//   }

//   return fileContents.replace(/\r/g, '');
// }


export async function createPath(directory: string, name: string, extension: string) {
  for (let index = 0; index < 1000; index++) {
    const filePath =
      path.resolve(directory, name + (index > 0 ? index.toString() : "")) + "." + extension;
    if (!(await fileExists(filePath)) && !(await dirExists(filePath))) {
      return filePath;
    }
  }
  throw new Error(`Can not create a file: ${name}.${extension}`);
}

export async function fileExists(filepath: string) {
  try {
    const p = await fs.promises.lstat(filepath);
    const result = p.isFile();
    return result;
  } catch  {
    return false;
  }
}

export async function dirExists(filepath: string) {
  try {
    const p = (await fs.promises.lstat(filepath));
    const res = p.isDirectory();
    return res;
  } catch {
    return false;
  }
}

export async function rmDirIfExist(pathFolder: string, option: {}) {
  try {
    const isExist = await dirExists(pathFolder);
    if (!isExist) {
      // no folder no delete
      return;
    }
    await fs.promises.rm(pathFolder, option);
  } catch (error) {
    throw error;
  }
}

export async function rmFileIfExist(pathFile: string, option: { force: true }) {
  try {
    const isExist = await fileExists(pathFile);
    if (!isExist) {
      // no file no delete
      return;
    }
    await fs.promises.rm(pathFile, option);
  } catch (error) {
    throw error;
  }
}

function s2u(sb: Buffer) {
  // todo for non japanese language
  //const vbsEncode = vscode.workspace.getConfiguration("vbecm").get<string>("vbsEncode") || "windows-31j";
  // https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding
  return iconv.decode(sb, "windows-31j");

  // if japanese, select below
  // const r = Encoding.convert(sb, {
  //   to: "UNICODE",
  //   type: "string",
  // });
  // return r;
}

export type VbsSpawn = typeof cmdSpawn;
export function cmdSpawn(
  command: string,
  param: string[],
  cwd: string,
  timeout: number,
  ac: AbortController,
  showMessage?: ShowMessage
) {
  return new Promise<number>(async (resolve, reject) => {

    const { signal } = ac;


    const p = spawn(command, [...param], {
      cwd,
      timeout: timeout ?? 60_000,
      signal,
    });

    //
    p.stdout.on("data", (data) => {
      const r = s2u(data);
      r.split("\n")
        .filter((d: string) => d.trim())
        .forEach((d: unknown) => showMessage?.(MessageType.info, d, "command"));
    });
    //
    p.stderr.on("data", (data) => {
      const r = s2u(data as Buffer);
      r.split("\n")
        .filter((d: string) => d.trim())
        .forEach((d: unknown) => showMessage?.(MessageType.err, d, "command"));
    });
    //
    p.on("close", (r = 9999) => {
      if (r === 0) {
        showMessage?.(MessageType.info, "complete!!", "command");
        return resolve(r);
      } else if (ac.signal.aborted) {
        showMessage?.(MessageType.info, "convert is aborted.", "common");
        return resolve(r ?? 9999);
      } else {
        showMessage?.(
          MessageType.err,
          `some error happens. code: ${r} killed? : ${p.killed}`,
          "command"
        );
        return reject(r);
      }
    });

    const cleanup = () => {
      showMessage?.(MessageType.info, `spawn kill pid: ${p.pid}`, "common");
      p.kill();
    };

    // for windows, they do not work. may be
    p.on("SIGINT", cleanup);
    p.on("SIGTERM", cleanup);
    p.on("SIGQUIT", cleanup);
  });
}
