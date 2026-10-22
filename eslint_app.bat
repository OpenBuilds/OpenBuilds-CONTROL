@REM This file combines all app source files into one and validates it with eslint.
@REM eslint can't process multiple scripts that are linked together by index.html, because it assumes every file has its own local environment.
@REM 
@REM Update this file when adding more scripts to index.html.
@REM The echo // NOTE lines insert comments into all.js that force warnings in the eslint log.
@REM This helps identify which original file has which issue from the log.

cd app
copy /b globals.js all.js

echo // >> all.js
echo // NOTE: js\ui.js >> all.js
copy /b all.js + js\ui.js

echo // >> all.js
echo // NOTE: js\theme.js >> all.js
copy /b all.js + js\theme.js

echo // >> all.js
echo // NOTE: js\settings.js >> all.js
copy /b all.js + js\settings.js

echo // >> all.js
echo // NOTE: js\macros.js >> all.js
copy /b all.js + js\macros.js

echo // >> all.js
echo // NOTE: js\viewer.js >> all.js
copy /b all.js + js\viewer.js

echo // >> all.js
echo // NOTE: js\viewer-ruler.js >> all.js
copy /b all.js + js\viewer-ruler.js

echo // >> all.js
echo // NOTE: js\main.js >> all.js
copy /b all.js + js\main.js

echo // >> all.js
echo // NOTE: js\updates.js >> all.js
copy /b all.js + js\updates.js

echo // >> all.js
echo // NOTE: js\grbl-settings-defaults.js >> all.js
copy /b all.js + js\grbl-settings-defaults.js

echo // >> all.js
echo // NOTE: js\grbl-settings-templates.js >> all.js
copy /b all.js + js\grbl-settings-templates.js

echo // >> all.js
echo // NOTE: js\grbl-settings.js >> all.js
copy /b all.js + js\grbl-settings.js

echo // >> all.js
echo // NOTE: js\websocket.js >> all.js
copy /b all.js + js\websocket.js

echo // >> all.js
echo // NOTE: js\metroactions.js >> all.js
copy /b all.js + js\metroactions.js

echo // >> all.js
echo // NOTE: js\jog.js >> all.js
copy /b all.js + js\jog.js

echo // >> all.js
echo // NOTE: js\servo.js >> all.js
copy /b all.js + js\servo.js

echo // >> all.js
echo // NOTE: js\widget.js >> all.js
copy /b all.js + js\widget.js

echo // >> all.js
echo // NOTE: js\keyboard.js >> all.js
copy /b all.js + js\keyboard.js

echo // >> all.js
echo // NOTE: lib\3dview\3dview.js >> all.js
copy /b all.js + lib\3dview\3dview.js

echo // >> all.js
echo // NOTE: wizards\calibration\calibrate.js >> all.js
copy /b all.js + wizards\calibration\calibrate.js

echo // >> all.js
echo // NOTE: wizards\calibration\calibrate-x.js >> all.js
copy /b all.js + wizards\calibration\calibrate-x.js

echo // >> all.js
echo // NOTE: wizards\calibration\calibrate-y.js >> all.js
copy /b all.js + wizards\calibration\calibrate-y.js

echo // >> all.js
echo // NOTE: wizards\calibration\calibrate-z.js >> all.js
copy /b all.js + wizards\calibration\calibrate-z.js

echo // >> all.js
echo // NOTE: w..\calibration\calibrate-servo.js >> all.js
copy /b all.js + wizards\calibration\calibrate-servo.js

echo // NOTE: wizards\probe\probev2.js >> all.js
copy /b all.js + wizards\probe\probev2.js

echo // NOTE: wizards\probe\holefinder.js >> all.js
copy /b all.js + wizards\probe\holefinder.js

echo // NOTE: wizards\surfacing\surfacing.js >> all.js
copy /b all.js + wizards\surfacing\surfacing.js

echo // NOTE: wizards\heightmap\heightmap.js >> all.js
copy /b all.js + wizards\heightmap\heightmap.js

echo // NOTE: wizards\jobstats\jobstats.js >> all.js
copy /b all.js + wizards\jobstats\jobstats.js

echo // NOTE: wizards\resume\resume.js >> all.js
copy /b all.js + wizards\resume\resume.js

echo // NOTE: js\ui.js >> all.js
copy /b all.js + js\toolchange.js

cd ..

npx eslint app\all.js > app\eslint.log
