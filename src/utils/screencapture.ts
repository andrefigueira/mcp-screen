import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

function exec(
  cmd: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 10_000 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

async function captureToBase64(args: string[]): Promise<string> {
  const tmpPath = join(tmpdir(), `mcp-screen-${randomUUID()}.png`);
  try {
    await exec("screencapture", ["-x", ...args, tmpPath]);
    const buffer = await readFile(tmpPath);
    return buffer.toString("base64");
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

export async function captureAllDisplays(): Promise<string> {
  return captureToBase64([]);
}

export async function captureDisplay(displayIndex: number): Promise<string> {
  return captureToBase64(["-D", String(displayIndex)]);
}

export async function captureFrontmostWindow(): Promise<string> {
  const { stdout } = await exec("osascript", [
    "-e",
    `tell application "System Events" to set wID to id of first window of (first application process whose frontmost is true)`,
    "-e",
    "return wID",
  ]);
  const windowId = stdout.trim();
  if (!windowId) {
    throw new Error("No frontmost window found");
  }
  return captureToBase64(["-l", windowId]);
}
