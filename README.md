# mcp-screen

MCP server that gives Claude Code native screen capture on macOS. Stop dragging screenshots into chat. Just ask Claude to look at your screen.

## Setup

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "screen": {
      "command": "npx",
      "args": ["mcp-screen"]
    }
  }
}
```

Restart Claude Code. Done.

## Usage

Just ask Claude naturally:

- "Look at my screen"
- "What's on my second monitor?"
- "Capture this window"
- "How many displays do I have?"

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_displays` | List available displays with names and resolutions | None |
| `capture_screen` | Capture all displays | None |
| `capture_display` | Capture a specific display by index | `display_index` (1-based) |
| `capture_window` | Capture the frontmost window | None |

All captures return full-resolution PNGs directly in chat.

## Permissions

Your terminal needs **Screen Recording** permission:

**System Settings > Privacy & Security > Screen Recording** - enable your terminal app.

## Requirements

- macOS
- Node.js >= 18

## Author

[@voidmode](https://x.com/voidmode)

## License

MIT
