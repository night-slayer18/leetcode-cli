# TUI Guide

The CLI includes an interactive Terminal UI (TUI) for browsing and solving problems without typing full commands.

## Launch

```bash
leetcode
```

Launch behavior:

- No arguments + interactive terminal: starts TUI.
- No arguments + non-interactive output (piped/CI): prints CLI help.
- With arguments: runs normal command mode.

## Core Navigation

Use these from the TUI:

- `j/k` or `up/down`: move cursor or scroll.
- `Enter`: open/select.
- `Esc`: go back or close current drawer/panel.
- `?`: open/close keyboard help.
- `Ctrl+C`: quit immediately.
- `q`: quit from Home.

## Screen Map

- **Home**: entry point to list, daily/random, bookmarks, timer, stats, workspace, config, changelog, help.
- **List**: filter and search problems, then open one with `Enter`.
- **Problem**: full statement view + bottom action bar.
- **Workspace**: manage and switch workspaces, edit workspace properties.
- **Config**: edit active workspace settings.
- **Stats / Timer / Changelog / Help**: read-only data and navigation views.

## Problem Screen (Drawer Model)

Problem view now uses a single-column layout:

- Full-width statement content.
- Unified bottom drawer for action output.
- One action hint row (no duplicate hint bars).

Action keys:

- `p`: pick file
- `t`: run tests
- `s`: submit
- `h`: hints
- `H` or `S`: submissions
- `V`, `v`, or `w`: snapshots
- `b`: bookmark toggle
- `n`: view note
- `e`: edit note

Drawer behavior:

- `Tab`: toggle focus between statement body and drawer.
- `j/k` or `up/down`: scroll focused region.
- `Esc`: close drawer first; press again to leave problem screen.

## Workspace and Config Editing

Both screens use buffered editing:

- Move/select fields with arrows or `j/k`.
- `Enter`: start edit or save.
- `Esc`: cancel current edit or go back.
- `Tab` / `h` / `l`: switch pane focus.

## Terminal Cleanup Guarantees

When leaving TUI (quit or opening external editor), the app restores terminal state:

- exits alternate screen
- restores cursor visibility
- disables raw mode
- applies ANSI reset guards to avoid style residue

If your terminal still looks wrong after an interrupted session, run:

```bash
reset
```

