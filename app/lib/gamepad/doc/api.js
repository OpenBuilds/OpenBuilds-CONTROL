YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "AnimFrameUpdateStrategy",
        "FirefoxPlatform",
        "Gamepad",
        "ManualUpdateStrategy",
        "WebKitPlatform"
    ],
    "modules": [
        "Gamepad"
    ],
    "allModules": [
        {
            "displayName": "Gamepad",
            "name": "Gamepad",
            "description": "This strategy uses a timer function to call an update function.\nThe timer (re)start function can be provided or the strategy reverts to\none of the window.*requestAnimationFrame variants."
        }
    ]
} };
});