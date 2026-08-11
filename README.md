# OpenBuilds CONTROL
OpenBuilds CONTROL - Grbl Host / Interface for all CNC style machines running Grbl

---

## About this fork

**This is a modified fork of OpenBuilds CONTROL, not the original.** The upstream
project is at https://github.com/OpenBuilds/OpenBuilds-CONTROL.

Changes in this fork, made 2026-08-11, are confined to window management on Linux-
based hosts:

- **Native window decorations on Linux.** Upstream creates a frameless window and
  draws its own titlebar. Under Wayland a frameless window gets no compositor
  resize edges and does not reliably report its maximized state, so the window
  manager now draws the titlebar on Linux. Windows and macOS are unchanged.
- **Window minimums lowered from 1000x850 to 800x600.** This was a problem for my
  CNC computer as it uses a 1366x768 display - upstream's own comment reads 
  `1366 * 768 == minimum to cater for` directly above `minHeight: 850`. The window
  therefore could not be shrunk to fit the screen, and maximizing was an
  unsatisfiable constraint.
- **Initial size clamped to the available work area**, so the window opens at a
  size that fits the screen.
- **Maximized state tracked from window events** rather than `isMaximized()`,
  which is unreliable under Wayland.
- **Close-to-tray fixed** to use `event.preventDefault()`; returning `false` does
  not cancel an Electron close.

Modified files carry notices at the top: `index.js`, `app/index.html`,
`app/js/websocket.js`.

Verified on Ubuntu 26.04 (GNOME 50, Wayland) against a 1280x768 display.

## License

This project is licensed under the **GNU General Public License v3.0**; the full
text is in [LICENSE](LICENSE) and is unmodified from upstream.

Note a discrepancy inherited from upstream: `LICENSE` contains the GPL-3.0 text,
while `package.json` declares `"license": "AGPL-3.0"`. Both have been present
since upstream's first commit, and the company behind OpenBuilds is no longer
operating, so there is no authority available to resolve which was intended.

Neither file has been altered in this fork. Because AGPL-3.0's obligations are a
superset of GPL-3.0's - AGPL adds section 13, covering source provision to users
who interact with the software over a network - **this fork is distributed in
compliance with the stricter AGPL-3.0 reading**, which satisfies the GPL-3.0
reading as well. Complete corresponding source is published in this repository.

Note that OpenBuilds CONTROL serves its user interface over HTTP on port 3000.
If you run a modified version and allow others to reach that interface over a
network, the AGPL-3.0 reading would require you to offer those users the source
of your modified version from within the application itself.

## Download

#### Latest Version
Click to download latest version:  [![Latest Version](https://img.shields.io/github/package-json/v/openbuilds/openbuilds-control.svg)](https://github.com/OpenBuilds/OpenBuilds-CONTROL/releases/latest)

#### Older Versions
Click to see all past releases:  [![Downloads](https://img.shields.io/github/downloads/openbuilds/sw-machine-drivers/total.svg)](https://github.com/OpenBuilds/OpenBuilds-CONTROL/releases)

# Development:

### Build Status (Windows, Linux, Mac):
[![Build/release](https://github.com/OpenBuilds/OpenBuilds-CONTROL/actions/workflows/build.yml/badge.svg)](https://github.com/OpenBuilds/OpenBuilds-CONTROL/actions/workflows/build.yml)

![Screenshot](https://raw.githubusercontent.com/OpenBuilds/OpenBuilds-CONTROL/master/docs/control.PNG)
