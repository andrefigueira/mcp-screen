#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handleCaptureScreen } from "./tools/capture-screen.js";
import { handleCaptureDisplay } from "./tools/capture-display.js";
import { handleCaptureWindow } from "./tools/capture-window.js";
import { handleListDisplays } from "./tools/list-displays.js";

const server = new McpServer({
  name: "mcp-screen",
  version: "1.0.0",
});

server.tool(
  "capture_screen",
  "Capture a screenshot of all displays. Returns a full-resolution PNG image.",
  {},
  async () => handleCaptureScreen()
);

server.tool(
  "capture_display",
  "Capture a screenshot of a specific display by index. Use list_displays first to see available displays.",
  { display_index: z.number().int().min(1).describe("Display index (1-based). Use list_displays to find available indices.") },
  async ({ display_index }) => handleCaptureDisplay(display_index)
);

server.tool(
  "capture_window",
  "Capture a screenshot of the frontmost window only.",
  {},
  async () => handleCaptureWindow()
);

server.tool(
  "list_displays",
  "List all available displays with their names and resolutions.",
  {},
  async () => handleListDisplays()
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
