import { captureFrontmostWindow } from "../utils/screencapture.js";

export async function handleCaptureWindow() {
  const base64 = await captureFrontmostWindow();
  return {
    content: [
      {
        type: "image" as const,
        data: base64,
        mimeType: "image/png",
      },
    ],
  };
}
