import { captureDisplay } from "../utils/screencapture.js";

export async function handleCaptureDisplay(displayIndex: number) {
  const base64 = await captureDisplay(displayIndex);
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
