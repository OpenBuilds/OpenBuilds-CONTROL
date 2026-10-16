# OpenBuilds CONTROL
OpenBuilds CONTROL is a G-code sender software for all CNC style machines running Grbl.

This is a fork by Ivo Beltchev with multiple improvements.

### Workflow

* Ability to view and set machine coordinates
* Stores a history of work origins and allows for rolling back to a previous one
* Corrected the calculations and improved the safety of the "goto zero" buttons
* More accurate machine limits, compatible with a variety of homing settings for Grbl, GrblHAL and FluidNC
* The Pause and Stop buttons remain available until the very end of the job
* While the job is paused, the Tool Off button can stop the spindle. It will resume automatically
* A new setting to insert a delay for a few seconds after the spindle starts up
* A new setting to hide the controls for the 4th axis if it is supported, but not used
* The "Recover from line" feature is more reliable
* Doesn't reset the "recently homed" status for errors and alerts that don't invalidate the machine position
* The homing button prevents accidental homing, and has a menu for homing a single axis if the hardware supports it
* Improved the speed and reliability of the controller detection over USB cable

### User Interface

* Removed the dropdown menu from the Open G-code button to save unnecessary mouse click
* New button to reload the current G-code file or load from a list of recent files
* New dialog for editing all application settings in one place
* New settings to disable the autostart and the tray icon, making it behave like a regular desktop app
* Allow clearing the key assignment in the keyboard shortcut editor and the macro editor
* The dialogs for opening and saving files have independent default directories for G-code, macros and grbl settings
* The position of the main window is preserved between runs
* Fix for dragging sliders with the mouse
* Improved readability for Light and Dark themes

### 3D View

* Updated the 3D view to properly handle arcs in the XZ and YZ planes
* Fixed the orbiting controls rotation axis
* Added playback controls to the simulation and fixed many bugs
* Fixed the wrong bounding box for the machine area
* Fixed the grid alignment and sizing
* Optimized memory usage to allow for loading of larger files
* Options to hide graphical elements like the grid, ruler, tool marker, and more
* Fixed GPU memory leaks

### Grbl Settings Editor

* The "Advanced" tab is selected by default because it is more useful for non-OpenBuilds customers
* Added a new option to view only the modified settings, and buttons to revert each change
* Fixed a bug where using the search filter loses all unsaved changes
* Fixed the broken tooltips for the setting descriptions
* Fixed bugs in the backup feature that would corrupt certain settings, especially for GrblHAL
* Added more known GrblHAL settings and updated wrong descriptions
* Added support for a 4th axis in settings $3 and $23
* Basic support for FluidNC that shows the configuration file

### Surfacing Wizard

* Fix for a bug where the last row was sometimes skipped
* New option to extend the surfaced area by the tool radius

### Macro Management

* Added ability to organize macros into groups
* Added menu command to back up all macros to a single file
* Added menu command to create a new macro from existing G-code or JavaScript file
* Added ability to automatically reload JavaScript macros from external files in development mode
* Enabled security isolation measures to prevent scripts from accessing the operating system

### New Heightmap Tool

* You can generate a heightmap by sampling the surface at multiple points
* The heightmap can then be used to modify the G-code to follow the surface

### Code Improvements

Last but not least, there have been countless improvements to the codebase behind the scenes.
The goal is to improve the readability and maintainability for long-term development.

* Removal of dead, redundant or duplicated code
* Simplification of convoluted logic with better handling of edge cases
* Use of safer language practices like strict mode and scoped variables
* Static code analysis using ESLint
* Upgrade to the latest Electron framework

## Useful Macros

The Javascript macros and the open UI architecture of OpenBuilds make it easy to extend it with custom functionality.

Over the years I have created multiple useful macros.
You can find them in the [Useful Macros folder](UsefulMacros/UsefulMacros.md).

Some are standalone versions of the new features, which can be added to the original software if you don't want to upgrade:

* **Macro manager** - Allows organizing macros into groups, export and import all macros into a single file
* **Heightmap** - Probes the height at points on a grid and modifies the G-code to follow the surface
* **Smart Home** - Prevents accidental homing and allows homing single axis if supported
* **Open File** - Removes the dropdown from the Open G-code button
* **StoreWcs** - Stores the work origin of the last job. This is a simplified version of the new WCS history feature

Others are new features that can be added to either this version or the original software:

* **Disable Z** - Disables the Z jog buttons for large step sizes (a safety feature)
* **Measure Z** - Measures the height of a surface without changing the work zero
* **Find Hole Center** - Fast and precise method for finding the center of a circular or rectangular hole
* **Spindle Delay** - Inserts a short delay after the spindle starts, without using the G4 command. Useful for hardware that has problems with G4.

## Closed Beta

Currently the software is in closed beta.
If you wish to give it a try on Windows or Linux, please send an email to cnc@ibeltchev.com.
I will reply with a download link. Everyone who contacts me gets to submit one of their favorite pet peeves
with the software (a bug, a quirk, a missing feature) and I promise I will look into it seriously.

Why not open beta? Few reasons. I want people to have an established contact with me to report bugs.
I want to be able to quickly distribute a new build in case a serious issue is found.
And frankly, I am considering changing the name of the software, but naming is hard, and I need more time to
come up with a good one (suggestions are welcome!)

Of course, you are free to build your own copy from the source code. These steps work for Windows and Linux, and I suspect it is the same for Mac:
* Install a recent version of node js (24 or above should work)
* Install git
* Clone the repo
* Run the command "npm install"
* Run the app locally with the command "node_modules\\.bin\electron ."
* Build a package with the command "node_modules\\.bin\electron-builder"


## Roadmap

### Cleanup

Before the official release, I plan to remove the parts that are specific to OpenBuilds hardware.
This includes the flashing capabilities and the bespoke configuration presets.
The hardware is no longer in production, and I can't realistically validate any of those features.

I will restore the update feature that checks for new versions and auto-updates the software.

### Public Release

After the closed beta I will make the binaries publicly available, with a few caveats:

* The Windows binaries will be unsigned. You will have to work around the Smart Screen restrictions to get it running.
Signing the installer requires a certificate, which is not free. At this time I can't justify the expense until I know that enough people
are even going to use it

* The Mac binaries will be completely untested and not notarized. I don't have a Mac to test them.
The last Apple product I've ever used was an Apple II, which was 40 years ago.
If you are a Mac developer and you are willing to help out, let me know

### Stabilization Period

The first few iterations of the public release will focus on stability, addressing bugs and compatibility issues that people report.
Please, report any issues you encounter. They can't be fixed if I don't know about them.

### Future Features

Adding new features is tricky, especially to this software. What made the original OpenBuilds so brilliant is its clean
and approachable user interface. New features by their very nature complicate the interface as they need their own space on the screen.
I have seen too many apps get bloated over time to an unusable mess because of the urge to add new features in each release.

New features will be added only if they don't sacrifice usability. Here are a few things I am considering:

* **Gamepad support** - will allow you to jog the machine using the analog stick, maybe let you assign actions to buttons

* **Rotary preview** - correctly show toolpaths that use the A axis in the 3d view

* **Tool change support** - allow for manual or assisted tool change

That said, new features can be added via macros as well. The bar for those is lower than for features in the main software,
since they are optional addons, and usually address a niche need.
I am more willing to add new features this way, especially if they can be back-ported to the original software.
A new feature could realistically start up as a macro, and then find its way into the main software after it as proven to work well.
