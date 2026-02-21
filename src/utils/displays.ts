import { execFile } from "node:child_process";

export interface DisplayInfo {
  index: number;
  name: string;
  resolution: string;
}

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

export async function listDisplays(): Promise<DisplayInfo[]> {
  const { stdout } = await exec("system_profiler", [
    "SPDisplaysDataType",
    "-json",
  ]);
  const data = JSON.parse(stdout);
  const displays: DisplayInfo[] = [];
  let index = 1;

  for (const gpu of data.SPDisplaysDataType ?? []) {
    for (const display of gpu.spdisplays_ndrvs ?? []) {
      const name = display._name ?? "Unknown Display";
      const res = display._spdisplays_resolution ?? "Unknown";
      displays.push({ index, name, resolution: res });
      index++;
    }
  }

  return displays;
}
