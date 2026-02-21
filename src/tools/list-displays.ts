import { listDisplays } from "../utils/displays.js";

export async function handleListDisplays() {
  const displays = await listDisplays();
  const text = displays
    .map((d) => `Display ${d.index}: ${d.name} (${d.resolution})`)
    .join("\n");
  return {
    content: [
      {
        type: "text" as const,
        text: text || "No displays found",
      },
    ],
  };
}
