# OpenBuilds CONTROL
OpenBuilds CONTROL - Grbl Host / Interface for all CNC style machines running Grbl

This is a fork by Ivo Beltchev. Notable changes:
* Fix for showing the RPM value in the tool slider
* Fix for dragging the slider with the mouse (bug in the external Metro UI library)
* Fix for inconsistencies between the click areas of menu items
* Added an option to reload the last gcode file
* Remembers the last used COM port and auto-selects it on startup
* Converted to a plain Windows app - no auto-start, no tray icon
* Added event for the Grbl "ok" response, which enables more reliable and responsive macros

## Download

#### Latest Version
Click to download latest version:  [![Latest Version](https://img.shields.io/github/package-json/v/openbuilds/openbuilds-control.svg)](https://github.com/OpenBuilds/OpenBuilds-CONTROL/releases/latest)

#### Older Versions
Click to see all past releases:  [![Downloads](https://img.shields.io/github/downloads/openbuilds/sw-machine-drivers/total.svg)](https://github.com/OpenBuilds/OpenBuilds-CONTROL/releases)

# Development:

### Build Status (Windows, Linux, Mac):
[![Build/release](https://github.com/OpenBuilds/OpenBuilds-CONTROL/actions/workflows/build.yml/badge.svg)](https://github.com/OpenBuilds/OpenBuilds-CONTROL/actions/workflows/build.yml)

![Screenshot](https://raw.githubusercontent.com/OpenBuilds/OpenBuilds-CONTROL/master/docs/control.PNG)
