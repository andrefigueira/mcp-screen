import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { writeFile } from "node:fs/promises";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";
import { createServer } from "../src/index.js";

const mockExecFile = vi.mocked(execFile);

function connectClientServer() {
  const server = createServer();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  return {
    server,
    client,
    async connect() {
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);
    },
    async close() {
      await Promise.all([
        clientTransport.close(),
        serverTransport.close(),
      ]);
    },
  };
}

describe("MCP Server", () => {
  it("initializes and reports server info", async () => {
    const { client, connect, close } = connectClientServer();
    await connect();

    const version = client.getServerVersion();
    expect(version?.name).toBe("mcp-screen");
    expect(version?.version).toBe("1.0.0");

    await close();
  });

  it("lists all 4 tools", async () => {
    const { client, connect, close } = connectClientServer();
    await connect();

    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();

    expect(names).toEqual([
      "capture_display",
      "capture_screen",
      "capture_window",
      "list_displays",
    ]);

    await close();
  });

  it("capture_display requires display_index parameter", async () => {
    const { client, connect, close } = connectClientServer();
    await connect();

    const { tools } = await client.listTools();
    const capDisplay = tools.find((t) => t.name === "capture_display");

    expect(capDisplay?.inputSchema.required).toContain("display_index");
    expect(capDisplay?.inputSchema.properties).toHaveProperty("display_index");

    await close();
  });

  it("capture_screen has no required parameters", async () => {
    const { client, connect, close } = connectClientServer();
    await connect();

    const { tools } = await client.listTools();
    const capScreen = tools.find((t) => t.name === "capture_screen");

    expect(capScreen?.inputSchema.required).toBeUndefined();

    await close();
  });

  it("each tool has a description", async () => {
    const { client, connect, close } = connectClientServer();
    await connect();

    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
    }

    await close();
  });
});

describe("Tool calls", () => {
  beforeEach(() => {
    mockExecFile.mockReset();
  });

  it("list_displays parses system_profiler output", async () => {
    const mockOutput = JSON.stringify({
      SPDisplaysDataType: [
        {
          spdisplays_ndrvs: [
            {
              _name: "Built-in Display",
              _spdisplays_resolution: "2560 x 1600",
            },
            {
              _name: "External Monitor",
              _spdisplays_resolution: "3840 x 2160",
            },
          ],
        },
      ],
    });

    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
        (cb as Function)(null, mockOutput, "");
      }) as typeof execFile
    );

    const { client, connect, close } = connectClientServer();
    await connect();

    const result = await client.callTool({
      name: "list_displays",
      arguments: {},
    });
    const content = result.content as Array<{ type: string; text: string }>;

    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("Built-in Display");
    expect(content[0].text).toContain("External Monitor");
    expect(content[0].text).toContain("2560 x 1600");
    expect(content[0].text).toContain("3840 x 2160");

    await close();
  });

  it("capture_screen returns base64 image", async () => {
    const fakeImage = Buffer.from("fake-png-data");

    mockExecFile.mockImplementation(
      ((_cmd: unknown, args: unknown, _opts: unknown, cb: unknown) => {
        const argsList = args as string[];
        // Last arg is always the temp file path
        const filePath = argsList[argsList.length - 1];
        writeFile(filePath, fakeImage).then(() =>
          (cb as Function)(null, "", "")
        );
      }) as typeof execFile
    );

    const { client, connect, close } = connectClientServer();
    await connect();

    const result = await client.callTool({
      name: "capture_screen",
      arguments: {},
    });
    const content = result.content as Array<{
      type: string;
      data: string;
      mimeType: string;
    }>;

    expect(content[0].type).toBe("image");
    expect(content[0].mimeType).toBe("image/png");
    expect(content[0].data).toBe(fakeImage.toString("base64"));

    await close();
  });

  it("capture_display passes display index flag", async () => {
    const fakeImage = Buffer.from("display-2-png");
    let capturedArgs: string[] = [];

    mockExecFile.mockImplementation(
      ((cmd: unknown, args: unknown, _opts: unknown, cb: unknown) => {
        const argsList = args as string[];
        if (cmd === "screencapture") {
          capturedArgs = argsList;
          const filePath = argsList[argsList.length - 1];
          writeFile(filePath, fakeImage).then(() =>
            (cb as Function)(null, "", "")
          );
        } else {
          (cb as Function)(null, "", "");
        }
      }) as typeof execFile
    );

    const { client, connect, close } = connectClientServer();
    await connect();

    const result = await client.callTool({
      name: "capture_display",
      arguments: { display_index: 2 },
    });
    const content = result.content as Array<{
      type: string;
      data: string;
      mimeType: string;
    }>;

    expect(capturedArgs).toContain("-D");
    expect(capturedArgs).toContain("2");
    expect(content[0].type).toBe("image");
    expect(content[0].data).toBe(fakeImage.toString("base64"));

    await close();
  });

  it("list_displays handles empty display list", async () => {
    const mockOutput = JSON.stringify({ SPDisplaysDataType: [] });

    mockExecFile.mockImplementation(
      ((_cmd: unknown, _args: unknown, _opts: unknown, cb: unknown) => {
        (cb as Function)(null, mockOutput, "");
      }) as typeof execFile
    );

    const { client, connect, close } = connectClientServer();
    await connect();

    const result = await client.callTool({
      name: "list_displays",
      arguments: {},
    });
    const content = result.content as Array<{ type: string; text: string }>;

    expect(content[0].text).toBe("No displays found");

    await close();
  });
});
