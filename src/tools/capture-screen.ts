import { captureAllDisplays } from "../utils/screencapture.js";

export async function handleCaptureScreen() {
  const base64 = await captureAllDisplays();
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
