var grblSettingsTemplate2 = {
  0: {
    key: `$0`,
    title: `Step pulse time, microseconds`,
    description: `Stepper drivers are rated for a certain minimum step pulse length. Check the data sheet or just try some numbers. You want the shortest pulses the stepper drivers can reliably recognize. If the pulses are too long, you might run into trouble when running the system at very high feed and pulse rates, because the step pulses can begin to overlap each other. We recommend something around 10 microseconds, which is the default value`,
    template: `<input id="val-0-input" data-role="input" data-clear-button="false" data-append="&micro;s" type="text">`,
    utils: ``
  },
  1: {
    key: `$1`,
    title: `Step idle delay, milliseconds`,
    description: `Every time your steppers complete a motion and come to a stop, Grbl will delay disabling the steppers by this value. OR, you can always keep your axes enabled (powered so as to hold position) by setting this value to the maximum 255 milliseconds. Again, just to repeat, you can keep all axes always enabled by setting $1=255. The stepper idle lock time is the time length Grbl will keep the steppers locked before disabling. Depending on the system, you can set this to zero and disable it. On others, you may need 25-50 milliseconds to make sure your axes come to a complete stop before disabling. This is to help account for machine motors that do not like to be left on for long periods of time without doing something. Also, keep in mind that some stepper drivers don't remember which micro step they stopped on, so when you re-enable, you may witness some 'lost' steps due to this. In this case, just keep your steppers enabled via $1=255`,
    template: `<input id="val-1-input" data-role="input" data-clear-button="false" data-append="ms" type="text">`,
    utils: ``
  },
  2: {
    key: `$2`,
    title: `Step pulse invert, mask`,
    description: `This setting inverts the step pulse signal. By default, a step signal starts at normal-low and goes high upon a step pulse event. After a step pulse time set by $0, the pin resets to low, until the next step pulse event. When inverted, the step pulse behavior switches from normal-high, to low during the pulse, and back to high. Most users will not need to use this setting, but this can be useful for certain CNC-stepper drivers that have peculiar requirements. For example, an artificial delay between the direction pin and step pulse can be created by inverting the step pin.`,
    template: `<input id="val-2-input" data-role="input" data-clear-button="false" data-append="mask" type="text">`,
    utils: ``
  },
  3: {
    key: `$3`,
    title: `Step direction invert, mask`,
    description: `This setting inverts the direction signal for each axis. By default, Grbl assumes that the axes move in a positive direction when the direction pin signal is low, and a negative direction when the pin is high. Often, axes don't move this way with some machines. This setting will invert the direction pin signal for those axes that move the opposite way.`,
    template: `<input  id="val-3-input" readonly type="hidden" />
       <table style="width: 100%;">
         <tr>
           <td><span class="text-small">X</span>
           </td>
           <td><span class="text-small">Normal</span>
           </td>
           <td class="pb-1">
             <label class="toggle">
               <input type="checkbox" id="xdirinvert" />
               <div>app-notification</div>
             </label>
           </td>
           <td><span class="text-small">Reversed</span>
           </td>
         </tr>
          <tr>
          <td><span class="text-small">Y</span>
          </td>
           <td><span class="text-small">Normal</span>
           </td>
           <td class="pb-1">
             <label class="toggle">
               <input type="checkbox" id="ydirinvert" />
               <div>app-notification</div>
             </label>
           </td>
           <td><span class="text-small">Reversed</span>
           </td>
         </tr>
         <tr>
           <td><span class="text-small">Z</span>
           </td>
           <td><span class="text-small">Normal</span>
           </td>
           <td class="pb-1">
             <label class="toggle">
               <input type="checkbox" id="zdirinvert" />
               <div>app-notification</div>
             </label>
           </td>
           <td><span class="text-small">Reversed</span>
           </td>
         </tr>
       </table>`,
    utils: ``
  },
  4: {
    key: `$4`,
    title: `Invert step enable pin, boolean`,
    description: `If you have an xPro 2/3 or BlackBox 4X, set it to 1. for BlackBox X32 set to 0. By default, the stepper enable pin is high to disable and low to enable. If your setup needs the opposite, just invert the stepper enable pin by typing $4=1. Disable with $4=0. (May need a power cycle to load the change.)`,
    template: `<input id="val-4-input" data-role="input" data-clear-button="false"  data-append="mask/bool" type="text">`,
    utils: ``
  },
  5: {
    key: `$5`,
    title: `Invert limit pins, boolean/mask`,
    description: `By default, the limit pins are held normally-high with the Arduino's internal pull-up resistor. When a limit pin is low, Grbl interprets this as triggered. For the opposite behavior, just invert the limit pins by typing $5=1. Disable with $5=0. You may need a power cycle to load the change. NOTE: For more advanced usage, the internal pull-up resistor on the limit pins may be disabled in config.h.`,
    template: `<input  id="val-5-input" data-role="input" data-clear-button="false"  data-append="mask/bool" type="text">`,
    utils: ``
  },
  6: {
    key: `$6`,
    title: `Invert probe pin, boolean`,
    description: `By default, the probe pin is held normally-high with the Arduino's internal pull-up resistor. When the probe pin is low, Grbl interprets this as triggered. For the opposite behavior, just invert the probe pin by typing $6=1. Disable with $6=0. You may need a power cycle to load the change.`,
    template: `<select id="val-6-input">
             <option value="0">&#x2717; Disable</option>
             <option value="1">&#x2713; Enable</option>
          </select>`,
    utils: ``
  },
  10: {
    key: `$10`,
    title: `Status report options, mask`,
    description: `This setting determines what Grbl real-time data it reports back to the user when a '?' status report is sent. This data includes current run state, real-time position, real-time feed rate, pin states, current override values, buffer states, and the g-code line number currently executing (if enabled through compile-time options).`,
    template: `<input id="val-10-input" data-role="input" data-clear-button="false" data-append="mask" type="text">`,
    utils: ``
  },
  11: {
    key: `$11`,
    title: `Junction deviation, millimeters`,
    description: `Junction deviation is used by the acceleration manager to determine how fast it can move through line segment junctions of a G-code program path. For example, if the G-code path has a sharp 10 degree turn coming up and the machine is moving at full speed, this setting helps determine how much the machine needs to slow down to safely go through the corner without losing steps`,
    template: `<input id="val-11-input" data-role="input" data-clear-button="false" data-append="mm" type="text">`,
    utils: ``
  },
  12: {
    key: `$12`,
    title: `Arc tolerance, millimeters`,
    description: `Grbl renders G2/G3 circles, arcs, and helices by subdividing them into teeny tiny lines, such that the arc tracing accuracy is never below this value. You will probably never need to adjust this setting, since 0.002mm is well below the accuracy of most all CNC machines. But if you find that your circles are too crude or arc tracing is performing slowly, adjust this setting. Lower values give higher precision but may lead to performance issues by overloading Grbl with too many tiny lines. Alternately, higher values traces to a lower precision, but can speed up arc performance since Grbl has fewer lines to deal with.`,
    template: `<input id="val-12-input" data-role="input" data-clear-button="false" data-append="mm" type="text">`,
    utils: ``
  },
  13: {
    key: `$13`,
    title: `Report in inches, boolean`,
    description: `Grbl has a real-time positioning reporting feature to provide a user feedback on where the machine is exactly at that time, as well as, parameters for coordinate offsets and probing. By default, it is set to report in mm, but by sending a $13=1 command, you send this boolean flag to true and these reporting features will now report in inches. $13=0 to set back to mm.`,
    template: `<select id="val-13-input">
             <option value="0">&#9898; Disable</option>
             <option value="1">&#9899; Enable</option>
          </select>`,
    utils: ``
  },
  20: {
    key: `$20`,
    title: `Soft limits enable, boolean`,
    description: `Soft limits is a safety feature to help prevent your machine from traveling too far and beyond the limits of travel, crashing or breaking something expensive. It works by knowing the maximum travel limits for each axis and where Grbl is in machine coordinates. Whenever a new G-code motion is sent to Grbl, it checks whether or not you accidentally have exceeded your machine space. If you do, Grbl will issue an immediate feed hold wherever it is, shutdown the spindle and coolant, and then set the system alarm indicating the problem. Machine position will be retained afterwards, since it's not due to an immediate forced stop like hard limits. NOTE: Soft limits requires homing to be enabled and accurate axis maximum travel settings, because Grbl needs to know where it is. $20=1 to enable, and $20=0 to disable.`,
    template: `
          <span id="grblSettingsLimits">&nbsp;</span>
          <select id="val-20-input">
             <option value="0">&#x2717; Disable</option>
             <option value="1">&#x2713; Enable</option>
          </select>`,
    utils: ``
  },
  21: {
    key: `$21`,
    title: `Hard limits enable, boolean`,
    description: `Hard limit work basically the same as soft limits, but use physical switches instead. Basically you wire up some switches (mechanical, magnetic, or optical) near the end of travel of each axes, or where ever you feel that there might be trouble if your program moves too far to where it shouldn't. When the switch triggers, it will immediately halt all motion, shutdown the coolant and spindle (if connected), and go into alarm mode, which forces you to check your machine and reset everything. To use hard limits with Grbl, the limit pins are held high with an internal pull-up resistor, so all you have to do is wire in a normally-open switch with the pin and ground and enable hard limits with $21=1. (Disable with $21=0.) We strongly advise taking electric interference prevention measures. If you want a limit for both ends of travel of one axes, just wire in two switches in parallel with the pin and ground, so if either one of them trips, it triggers the hard limit. Keep in mind, that a hard limit event is considered to be critical event, where steppers immediately stop and will have likely have lost steps. Grbl doesn't have any feedback on position, so it can't guarantee it has any idea where it is. So, if a hard limit is triggered, Grbl will go into an infinite loop ALARM mode, giving you a chance to check your machine and forcing you to reset Grbl. Remember it's a purely a safety feature.`,
    template: `<select id="val-21-input">
             <option value="0">&#x2717; Disable</option>
             <option value="1">&#x2713; Enable</option>
          </select>`,
    utils: ``
  },
  22: {
    key: `$22`,
    title: `Homing cycle enable, boolean (Grbl) / mask (GrblHAL)`,
    description: `The homing cycle is used to accurately and precisely locate a known and consistent position on a machine every time you start up your Grbl between sessions. In other words, you know exactly where you are at any given time, every time. Say you start machining something or are about to start the next step in a job and the power goes out, you re-start Grbl and Grbl has no idea where it is due to steppers being open-loop control. You're left with the task of figuring out where you are. If you have homing, you always have the machine zero reference point to locate from, so all you have to do is run the homing cycle and resume where you left off. To set up the homing cycle for Grbl, you need to have limit switches in a fixed position that won't get bumped or moved, or else your reference point gets messed up. Usually they are setup in the farthest point in +x, +y, +z of each axes. Wire your limit switches in with the limit pins, add a recommended RC-filter to help reduce electrical noise, and enable homing. If you're curious, you can use your limit switches for both hard limits AND homing. They play nice with each other. Prior to trying the homing cycle for the first time, make sure you have setup everything correctly, otherwise homing may behave strangely. First, ensure your machine axes are moving in the correct directions per Cartesian coordinates (right-hand rule). If not, fix it with the $3 direction invert setting. Second, ensure your limit switch pins are not showing as 'triggered' in Grbl's status reports. If are, check your wiring and settings. Finally, ensure your $13x max travel settings are somewhat accurate (within 20%), because Grbl uses these values to determine how far it should search for the homing switches. By default, Grbl's homing cycle moves the Z-axis positive first to clear the workspace and then moves both the X and Y-axes at the same time in the positive direction. To set up how your homing cycle behaves, there are more Grbl settings down the page describing what they do (and compile-time options as well.). Also, one more thing to note, when homing is enabled. Grbl will lock out all G-code commands until you perform a homing cycle. Meaning no axes motions, unless the lock is disabled ($X) but more on that later. Most, if not all CNC controllers, do something similar, as it is mostly a safety feature to prevent users from making a positioning mistake, which is very easy to do and be saddened when a mistake ruins a part. If you find this annoying or find any weird bugs, please let us know and we'll try to work on it so everyone is happy. :)  NOTE: Check out config.h for more homing options for advanced users. You can disable the homing lockout at startup, configure which axes move first during a homing cycle and in what order, and more.`,
    template: `<input id="val-22-input" data-role="input" data-clear-button="false" data-append="mask" type="text">`,
    utils: ``
  },
  23: {
    key: `$23`,
    title: `Homing direction invert, mask`,
    description: `By default, Grbl assumes your homing limit switches are in the positive direction, first moving the z-axis positive, then the x-y axes positive before trying to precisely locate machine zero by going back and forth slowly around the switch. If your machine has a limit switch in the negative direction, the homing direction mask can invert the axes' direction. It works just like the step port invert and direction port invert masks, where all you have to do is send the value in the table to indicate what axes you want to invert and search for in the opposite direction.`,
    template: `<input id="val-23-input" readonly type="hidden">
          <table style="width: 100%;">
            <tr>
              <td><span class="text-small">X</span>
              </td>
              <td><span class="text-small">Min</span>
              </td>
              <td class="pb-1">
                <label class="toggle">
                  <input type="checkbox" id="xHomeDir" />
                  <div>app-notification</div>
                </label>
              </td>
              <td><span class="text-small">Max</span>
              </td>
            </tr>
             <tr>
              <td><span class="text-small">Y</span>
              </td>
              <td><span class="text-small">Min</span>
              </td>
              <td class="pb-1">
                <label class="toggle">
                  <input type="checkbox" id="yHomeDir" />
                  <div>app-notification</div>
                </label>
              </td>
              <td><span class="text-small">Max</span>
              </td>
            </tr>
            <tr>
              <td><span class="text-small">Z</span>
              </td>
              <td><span class="text-small">Min</span>
              </td>
              <td class="pb-1">
                <label class="toggle">
                  <input type="checkbox" id="zHomeDir" />
                  <div>app-notification</div>
                </label>
              </td>
              <td><span class="text-small">Max</span>
              </td>
            </tr>
          </table>`,
    utils: ``
  },
  24: {
    key: `$24`,
    title: `Homing locate feed rate, mm/min`,
    description: `The homing cycle first searches for the limit switches at a higher seek rate, and after it finds them, it moves at a slower feed rate to home into the precise location of machine zero. Homing feed rate is that slower feed rate. Set this to whatever rate value that provides repeatable and precise machine zero locating.`,
    template: `<input id="val-24-input" data-role="input" data-clear-button="false" data-append="mm/min" type="text">`,
    utils: ``
  },
  25: {
    key: `$25`,
    title: `Homing search seek rate, mm/min`,
    description: `Homing seek rate is the homing cycle search rate, or the rate at which it first tries to find the limit switches. Adjust to whatever rate gets to the limit switches in a short enough time without crashing into your limit switches if they come in too fast.`,
    template: `<input id="val-25-input" data-role="input" data-clear-button="false" data-append="mm/min" type="text">`,
    utils: ``
  },
  26: {
    key: `$26`,
    title: `Homing switch debounce delay, milliseconds`,
    description: `Whenever a switch triggers, some of them can have electrical/mechanical noise that actually 'bounce' the signal high and low for a few milliseconds before settling in. To solve this, you need to debounce the signal, either by hardware with some kind of signal conditioner or by software with a short delay to let the signal finish bouncing. Grbl performs a short delay, only homing when locating machine zero. Set this delay value to whatever your switch needs to get repeatable homing. In most cases, 5-25 milliseconds is fine.`,
    template: `<input id="val-26-input" data-role="input" data-clear-button="false" data-append="ms" type="text">`,
    utils: ``
  },
  27: {
    key: `$27`,
    title: `Homing switch pull-off distance, millimeters`,
    description: `To play nice with the hard limits feature, where homing can share the same limit switches, the homing cycle will move off all of the limit switches by this pull-off travel after it completes. In other words, it helps to prevent accidental triggering of the hard limit after a homing cycle. Make sure this value is large enough to clear the limit switch. If not, Grbl will throw an alarm error for failing to clear it.`,
    template: `<input id="val-27-input" data-role="input" data-clear-button="false" data-append="mm" type="text">`,
    utils: ``
  },
  30: {
    key: `$30`,
    title: `Maximum spindle speed, RPM`,
    description: `This sets the spindle speed for the maximum 5V PWM pin output. For example, if you want to set 10000rpm at 5V, program $30=10000. For 255rpm at 5V, program $30=255. If a program tries to set a higher spindle RPM greater than the $30 max spindle speed, Grbl will just output the max 5V, since it can't go any faster. By default, Grbl linearly relates the max-min RPMs to 5V-0.02V PWM pin output in 255 equally spaced increments. When the PWM pin reads 0V, this indicates spindle disabled. Note that there are additional configuration options are available in config.h to tweak how this operates.`,
    template: `<input id="val-30-input" data-role="input" data-clear-button="false" data-append="RPM" type="text">`,
    utils: ``
  },
  31: {
    key: `$31`,
    title: `Minimum spindle speed, RPM`,
    description: `This sets the spindle speed for the minimum 0.02V PWM pin output (0V is disabled). Lower RPM values are accepted by Grbl but the PWM output will not go below 0.02V, except when RPM is zero. If zero, the spindle is disabled and PWM output is 0V.`,
    template: `<input id="val-31-input" data-role="input" data-clear-button="false" data-append="RPM" type="text">`,
    utils: ``
  },
  32: {
    key: `$32`,
    title: `Laser-mode enable, boolean`,
    description: `When enabled, Grbl will move continuously through consecutive G1, G2, or G3 motion commands when programmed with a S spindle speed (laser power). The spindle PWM pin will be updated instantaneously through each motion without stopping. Please read the GRBL laser documentation and your laser device documentation prior to using this mode. Lasers are very dangerous. They can instantly damage your vision permanantly and cause fires. Grbl does not assume any responsibility for any issues the firmware may cause, as defined by its GPL license. When disabled, Grbl will operate as it always has, stopping motion with every S spindle speed command. This is the default operation of a milling machine to allow a pause to let the spindle change speeds.`,
    template: `<select id="val-32-input">
              <option value="0">&#x2717; Disable</option>
              <option value="1">&#x2713; Enable</option>
           </select>`,
    utils: ``
  },
  100: {
    key: `$100`,
    title: `X-axis steps per millimeter`,
    description: `Grbl needs to know how far each step will take the tool in reality.  - use the tools on the right to compute/calibrate`,
    template: `<input  id="val-100-input" data-role="input" data-clear-button="false" data-append="steps/mm" type="text">`,
    utils: `<center>
            <button title="Calculate X-Axis Steps per mm" class="button " type="button" onclick="xstepspermm()">
            <span class="fa-layers fa-fw">
            <i class="fas fa-calculator" data-fa-transform="shrink-2"></i>
            <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Calc</span>
            <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Steps</span>
            </span>
            </button>
            </center>`
  },
  101: {
    key: `$101`,
    title: `Y-axis steps per millimeter`,
    description: `Grbl needs to know how far each step will take the tool in reality.  - use the tools on the right to compute/calibrate1`,
    template: `<input  id="val-101-input" data-role="input" data-clear-button="false" data-append="steps/mm" type="text">`,
    utils: `<center>
            <button title="Calculate Y-Axis Steps per mm" class="button" type="button" onclick="ystepspermm()">
            <span class="fa-layers fa-fw">
            <i class="fas fa-calculator" data-fa-transform="shrink-2"></i>
            <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Calc</span>
            <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Steps</span>
            </span>
            </button>
            </center>`
  },
  102: {
    key: `$102`,
    title: `Z-axis steps per millimeter`,
    description: `Grbl needs to know how far each step will take the tool in reality.  - use the tools on the right to compute/calibrate`,
    template: `<input  id="val-102-input" data-role="input" data-clear-button="false" data-append="steps/mm" type="text">`,
    utils: `<center>
            <button title="Calculate Z-Axis Steps per mm" class="button" type="button" onclick="zstepspermm()">
            <span class="fa-layers fa-fw">
            <i class="fas fa-calculator" data-fa-transform="shrink-2"></i>
            <span class="fa-layers-text" data-fa-transform="up-16" style="font-weight:600; font-family: Arial; font-size: 10px;">Calc</span>
            <span class="fa-layers-text" data-fa-transform="down-19" style="font-weight:600; font-family: Arial; font-size: 10px;">Steps</span>
            </span>
            </button>
            </center>`
  },
  103: {
    key: `$103`,
    title: `A-axis steps per degree`,
    description: `Grbl needs to know how far each step will take the tool in reality.`,
    template: `<input  id="val-103-input" data-role="input" data-clear-button="false" data-append="steps/deg" type="text">`,
    utils: ``
  },
  110: {
    key: `$110`,
    title: `X-axis maximum rate, mm/min`,
    description: `This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.`,
    template: `<input id="val-110-input" data-role="input" data-clear-button="false" data-append="mm/min"  type="text">`,
    utils: ``
  },
  111: {
    key: `$111`,
    title: `Y-axis maximum rate, mm/min`,
    description: `This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.`,
    template: `<input id="val-111-input" data-role="input" data-clear-button="false" data-append="mm/min"  type="text">`,
    utils: ``
  },
  112: {
    key: `$112`,
    title: `Z-axis maximum rate, mm/min`,
    description: `This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.`,
    template: `<input  id="val-112-input" data-role="input" data-clear-button="false" data-append="mm/min"  type="text">`,
    utils: ``
  },
  113: {
    key: `$113`,
    title: `A-axis maximum rate, deg/min`,
    description: `This sets the maximum rate each axis can move. Whenever Grbl plans a move, it checks whether or not the move causes any one of these individual axes to exceed their max rate. If so, it'll slow down the motion to ensure none of the axes exceed their max rate limits. This means that each axis has its own independent speed, which is extremely useful for limiting the typically slower Z-axis. The simplest way to determine these values is to test each axis one at a time by slowly increasing max rate settings and moving it. For example, to test the X-axis, send Grbl something like G0 X50 with enough travel distance so that the axis accelerates to its max speed. You'll know you've hit the max rate threshold when your steppers stall. It'll make a bit of noise, but shouldn't hurt your motors. Enter a setting a 10-20% below this value, so you can account for wear, friction, and the mass of your workpiece/tool. Then, repeat for your other axes. NOTE: This max rate setting also sets the G0 seek rates.`,
    template: `<input  id="val-113-input" data-role="input" data-clear-button="false" data-append="deg/min"  type="text">`,
    utils: ``
  },
  120: {
    key: `$120`,
    title: `X-axis acceleration, mm/sec^2`,
    description: `This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.`,
    template: `<input  id="val-120-input" data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text">`,
    utils: ``
  },
  121: {
    key: `$121`,
    title: `Y-axis acceleration, mm/sec^2`,
    description: `This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.`,
    template: `<input  id="val-121-input" data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text">`,
    utils: ``
  },
  122: {
    key: `$122`,
    title: `Z-axis acceleration, mm/sec^2`,
    description: `This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.`,
    template: `<input  id="val-122-input" data-role="input" data-clear-button="false" data-append="mm/sec&sup2" type="text">`,
    utils: ``
  },
  123: {
    key: `$123`,
    title: `A-axis acceleration, deg/sec^2`,
    description: `This sets the axes acceleration parameters in mm/second/second. Simplistically, a lower value makes Grbl ease slower into motion, while a higher value yields tighter moves and reaches the desired feed rates much quicker. Much like the max rate setting, each axis has its own acceleration value and are independent of each other. This means that a multi-axis motion will only accelerate as quickly as the lowest contributing axis can. Again, like the max rate setting, the simplest way to determine the values for this setting is to individually test each axis with slowly increasing values until the motor stalls. Then finalize your acceleration setting with a value 10-20% below this absolute max value. This should account for wear, friction, and mass inertia. We highly recommend that you dry test some G-code programs with your new settings before committing to them. Sometimes the loading on your machine is different when moving in all axes together.`,
    template: `<input  id="val-123-input" data-role="input" data-clear-button="false" data-append="deg/sec&sup2" type="text">`,
    utils: ``
  },
  130: {
    key: `$130`,
    title: `X-axis maximum travel, millimeters`,
    description: `This sets the maximum travel from end to end for each axis in mm. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command.`,
    template: `<input id="val-130-input" data-role="input" data-clear-button="false" data-append="mm" type="text">`,
    utils: ``
  },
  131: {
    key: `$131`,
    title: `Y-axis maximum travel, millimeters`,
    description: `This sets the maximum travel from end to end for each axis in mm. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command.`,
    template: `<input id="val-131-input" data-role="input" data-clear-button="false" data-append="mm" type="text">`,
    utils: ``
  },
  132: {
    key: `$132`,
    title: `Z-axis maximum travel, millimeters`,
    description: `This sets the maximum travel from end to end for each axis in mm. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command.`,
    template: `<input id="val-132-input" data-role="input" data-clear-button="false" data-append="mm" type="text">`,
    utils: ``
  },
  133: {
    key: `$133`,
    title: `A-axis maximum travel, degrees`,
    description: `This sets the maximum travel from end to end for each axis. This is only useful if you have soft limits (and homing) enabled, as this is only used by Grbl's soft limit feature to check if you have exceeded your machine limits with a motion command.`,
    template: `<input id="val-133-input" data-role="input" data-clear-button="false" data-append="deg" type="text">`,
    utils: ``
  },
  7: {
    key: `$7`,
    title: `Disable spindle with 0 speed, boolean`,
    description: ``,
    template: `<input id="val-7-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  14: {
    key: `$14`,
    title: `Limit pins invert, mask`,
    description: ``,
    template: `<input id="val-14-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  15: {
    key: `$15`,
    title: `Coolant pins invert, mask`,
    description: ``,
    template: `<input id="val-15-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  16: {
    key: `$16`,
    title: `Spindle pins invert, mask`,
    description: ``,
    template: `<input id="val-16-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  17: {
    key: `$17`,
    title: `Control pins pullup disable, mask`,
    description: ``,
    template: `<input id="val-17-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  18: {
    key: `$18`,
    title: `Limit pins pullup disable, mask`,
    description: ``,
    template: `<input id="val-18-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  19: {
    key: `$19`,
    title: `Probe pin pullup disable, boolean`,
    description: ``,
    template: `<input id="val-19-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  28: {
    key: `$28`,
    title: `G73 retract distance, in mm`,
    description: ``,
    template: `<input id="val-28-input" data-role="input" data-clear-button="false" data-append="mm" type="text" >`,
    utils: ``
  },
  29: {
    key: `$29`,
    title: `Step pulse delay (ms)`,
    description: ``,
    template: `<input id="val-29-input" data-role="input" data-clear-button="false" data-append="ms" type="text" >`,
    utils: ``
  },
  33: {
    key: `$33`,
    title: `Spindle PWM frequency`,
    description: ``,
    template: `<input id="val-33-input" data-role="input" data-clear-button="false" data-append="Hz" type="text" >`,
    utils: ``
  },
  34: {
    key: `$34`,
    title: `Spindle off Value`,
    description: ``,
    template: `<input id="val-34-input" data-role="input" data-clear-button="false" data-append="S" type="text" >`,
    utils: ``
  },
  35: {
    key: `$35`,
    title: `Spindle min value`,
    description: ``,
    template: `<input id="val-35-input" data-role="input" data-clear-button="false" data-append="S" type="text" >`,
    utils: ``
  },
  36: {
    key: `$36`,
    title: `Spindle max value`,
    description: ``,
    template: `<input id="val-36-input" data-role="input" data-clear-button="false" data-append="S" type="text" >`,
    utils: ``
  },
  37: {
    key: `$37`,
    title: `Stepper deenergize mask`,
    description: ``,
    template: `<input id="val-37-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  38: {
    key: `$38`,
    title: `Spindle encoder pulses per revolution`,
    description: ``,
    template: `<input id="val-38-input" data-role="input" data-clear-button="false" data-append="ppr" type="text" >`,
    utils: ``
  },
  39: {
    key: `$39`,
    title: `Enable printable realtime command characters, boolean`,
    description: ``,
    template: `<input id="val-39-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  40: {
    key: `$40`,
    title: `Apply soft limits for jog commands, boolean`,
    description: ``,
    template: `<input id="val-40-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  43: {
    key: `$43`,
    title: `Homing passes`,
    description: ``,
    template: `<input id="val-43-input" data-role="input" data-clear-button="false" data-append="passes" type="text" >`,
    utils: ``
  },
  44: {
    key: `$44`,
    title: `Homing cycle 1`,
    description: ``,
    template: `<input id="val-44-input" data-role="input" data-clear-button="false" data-append="-" type="text" >`,
    utils: ``
  },
  45: {
    key: `$45`,
    title: `Homing cycle 2`,
    description: ``,
    template: `<input id="val-45-input" data-role="input" data-clear-button="false" data-append="-" type="text" >`,
    utils: ``
  },
  46: {
    key: `$46`,
    title: `Homing cycle 3`,
    description: ``,
    template: `<input id="val-46-input" data-role="input" data-clear-button="false" data-append="-" type="text" >`,
    utils: ``
  },
  47: {
    key: `$47`,
    title: `Homing cycle 4`,
    description: ``,
    template: `<input id="val-47-input" data-role="input" data-clear-button="false" data-append="-" type="text" >`,
    utils: ``
  },
  48: {
    key: `$48`,
    title: `Homing cycle 5`,
    description: ``,
    template: `<input id="val-48-input" data-role="input" data-clear-button="false" data-append="-" type="text" >`,
    utils: ``
  },
  49: {
    key: `$49`,
    title: `Homing cycle 6`,
    description: ``,
    template: `<input id="val-49-input" data-role="input" data-clear-button="false" data-append="-" type="text" >`,
    utils: ``
  },
  62: {
    key: `$62`,
    title: `Sleep Enable`,
    description: ``,
    template: `<input id="val-62-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  63: {
    key: `$63`,
    title: `Feed Hold Actions`,
    description: `Disable Laser During Hold, Restore Spindle/Coolant on Resume (Mask)`,
    template: `<input id="val-63-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  64: {
    key: `$64`,
    title: `Force Init Alarm`,
    description: ``,
    template: `<input id="val-64-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  341: {
    key: `$341`,
    title: `Tool Change Mode`,
    description: ``,
    template: `<input id="val-341-input" data-role="input" data-clear-button="false" data-append="mode" type="text" >`,
    utils: ``
  },
  342: {
    key: `$342`,
    title: `Tool Change probing distance`,
    description: ``,
    template: `<input id="val-342-input" data-role="input" data-clear-button="false" data-append="mm" type="text" >`,
    utils: ``
  },
  343: {
    key: `$343`,
    title: `Tool Change Locate Feed rate`,
    description: ``,
    template: `<input id="val-343-input" data-role="input" data-clear-button="false" data-append="mm/min" type="text" >`,
    utils: ``
  },
  344: {
    key: `$344`,
    title: `Tool Change Search Seek rate`,
    description: ``,
    template: `<input id="val-344-input" data-role="input" data-clear-button="false" data-append="mm/min" type="text" >`,
    utils: ``
  },
  345: {
    key: `$345`,
    title: `Tool Change Probe Pull Off rate`,
    description: ``,
    template: `<input id="val-345-input" data-role="input" data-clear-button="false" data-append="mm/min" type="text" >`,
    utils: ``
  },
  370: {
    key: `$370`,
    title: `Invert I/O Port Inputs (mask)`,
    description: ``,
    template: `<input id="val-370-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  384: {
    key: `$384`,
    title: `Disable G92 Persistence`,
    description: ``,
    template: `<input id="val-384-input" data-role="input" data-clear-button="false" data-append="bool" type="text" >`,
    utils: ``
  },
  70: {
    key: `$70`,
    title: `Network Services`,
    description: `70`,
    template: `<input id="val-70-input" data-role="input" data-clear-button="false" data-append="mask" type="text" >`,
    utils: ``
  },
  300: {
    key: `$300`,
    title: `Hostname`,
    description: ``,
    template: `<input id="val-300-input" data-role="input" data-clear-button="false" data-append="text" type="text" >`,
    utils: ``
  },
  302: {
    key: `$302`,
    title: `IP Address`,
    description: ``,
    template: `<input id="val-302-input" data-role="input" data-clear-button="false" data-append="ip" type="text" >`,
    utils: ``
  },
  303: {
    key: `$303`,
    title: `Gateway`,
    description: ``,
    template: `<input id="val-303-input" data-role="input" data-clear-button="false" data-append="gateway" type="text" >`,
    utils: ``
  },
  304: {
    key: `$304`,
    title: `Netmask`,
    description: ``,
    template: `<input id="val-304-input" data-role="input" data-clear-button="false" data-append="netmask" type="text" >`,
    utils: ``
  },
  305: {
    key: `$305`,
    title: `Telnet Port`,
    description: ``,
    template: `<input id="val-305-input" data-role="input" data-clear-button="false" data-append="tcp" type="text" >`,
    utils: ``
  },
  306: {
    key: `$306`,
    title: `HTTP Port`,
    description: ``,
    template: `<input id="val-306-input" data-role="input" data-clear-button="false" data-append="tcp" type="text" >`,
    utils: ``
  },
  307: {
    key: `$307`,
    title: `Websocket Port`,
    description: ``,
    template: `<input id="val-307-input" data-role="input" data-clear-button="false" data-append="tcp" type="text" >`,
    utils: ``
  },
  73: {
    key: `$73`,
    title: `Wifi Mode`,
    description: ``,
    template: `<input id="val-73-input" data-role="input" data-clear-button="false" data-append="mode" type="text" >`,
    utils: ``
  },
  74: {
    key: `$74`,
    title: `Wifi network SSID`,
    description: ``,
    template: `<input id="val-74-input" data-role="input" data-clear-button="false" data-append="ssid" type="text" >`,
    utils: ``
  },
  75: {
    key: `$75`,
    title: `Wifi network PSK`,
    description: ``,
    template: `<input id="val-75-input" data-role="input" data-clear-button="false" data-append="psk" type="text" >`,
    utils: ``
  },
  65: {
    key: `$65`,
    title: `Require homing sequence to be executed at startup`,
    description: `Require homing sequence to be executed at startup(?). Replaces #define HOMING_INIT_LOCK.`,
    template: `<input id="val-65-input" data-role="input" data-clear-button="false" data-append="" type="number" >`,
    utils: ``
  },
  8: {
    key: `$8`,
    title: `Ganged axes direction invert as bitfield`,
    description: `Ganged axes direction invert as bitfield`,
    template: `<input id="val-8-input" data-role="input" data-clear-button="false" data-append="bitfield" type="number" >`,
    utils: ``
  },
  9: {
    key: `$9`,
    title: `PWM Spindle as bitfield where setting bit 0 enables the rest`,
    description: `PWM Spindle as bitfield where setting bit 0 enables the rest`,
    template: `<input id="val-9-input" data-role="input" data-clear-button="false" data-append="bitfield" type="number" >`,
    utils: ``
  },
  320: {
    key: `$320`,
    title: `Hostname, max: 64`,
    description: `Hostname, max: 64`,
    template: `<input id="val-320-input" data-role="input" data-clear-button="false" data-append="text" type="text" >`,
    utils: ``
  },
  322: {
    key: `$322`,
    title: `IP Address`,
    description: `IP Address`,
    template: `<input id="val-322-input" data-role="input" data-clear-button="false" data-append="ip" type="text" >`,
    utils: ``
  },
  323: {
    key: `$323`,
    title: `Gateway`,
    description: `Gateway as IP address, reboot required`,
    template: `<input id="val-323-input" data-role="input" data-clear-button="false" data-append="ip" type="text" >`,
    utils: ``
  },
  324: {
    key: `$324`,
    title: `Netmask`,
    description: `Netmask as IP address, reboot required`,
    template: `<input id="val-324-input" data-role="input" data-clear-button="false" data-append="bitfield" type="text" >`,
    utils: ``
  },
  325: {
    key: `$325`,
    title: `Telnet port`,
    description: `Telnet port, range: 1 - 65535 reboot required`,
    template: `<input id="val-325-input" data-role="input" data-clear-button="false" data-append="netmask" type="number" >`,
    utils: ``
  },
  326: {
    key: `$326`,
    title: `HTTP port`,
    description: `HTTP port, range: 1 - 65535, reboot required`,
    template: `<input id="val-326-input" data-role="input" data-clear-button="false" data-append="port" type="number" >`,
    utils: ``
  },
  327: {
    key: `$327`,
    title: `Websocket port`,
    description: `Websocket port, range: 1 - 65535, reboot require`,
    template: `<input id="val-327-input" data-role="input" data-clear-button="false" data-append="port" type="number" >`,
    utils: ``
  },
  346: {
    key: `$346`,
    title: `Restore position after M6 as boolean`,
    description: `Restore position after M6 as boolean`,
    template: `<input id="val-346-input" data-role="input" data-clear-button="false" data-append="bool" type="number" >`,
    utils: ``
  },
  396: {
    key: `$396`,
    title: `WebUI timeout in minutes`,
    description: `WebUI timeout in minutes`,
    template: `<input id="val-396-input" data-role="input" data-clear-button="false" data-append="min" type="number" >`,
    utils: ``
  },
  397: {
    key: `$397`,
    title: `WebUI auto report interval in milliseconds`,
    description: `WebUI auto report interval in milliseconds, max: 9999, reboot required`,
    template: `<input id="val-397-input" data-role="input" data-clear-button="false" data-append="ms" type="number" >`,
    utils: ``
  },
  398: {
    key: `$398`,
    title: `Planner buffer blocks`,
    description: `Planner buffer blocks, range: 30 - 1000, reboot required`,
    template: `<input id="val-398-input" data-role="input" data-clear-button="false" data-append="blocks" type="number" >`,
    utils: ``
  },
  481: {
    key: `$481`,
    title: `Autoreport interval in ms`,
    description: `Autoreport interval in ms, range: 100 - 1000, reboot required`,
    template: `<input id="val-481-input" data-role="input" data-clear-button="false" data-append="ms" type="number" >`,
    utils: ``
  },
  376: {
    key: `$376`,
    title: `Rotational axes as bitfield`,
    description: `Autoreport interval in ms, range: 100 - 1000, reboot required`,
    template: `<input id="val-376-input" data-role="input" data-clear-button="false" data-append="bitfield" type="number" >`,
    utils: ``
  },
  41: {
    key: `$41`,
    title: `Parking cycle as bitfield where setting bit 0 enables the rest`,
    description: `Parking cycle: Enable (1), Enable parking override control (2), Deactivate upon init (4)`,
    template: `<input id="val-41-input" data-role="input" data-clear-button="false" data-append="bitfield" type="number" >`,
    utils: ``
  },
  42: {
    key: `$42`,
    title: `Parking axis`,
    description: `Parking axis: X=1, Y=2, Z=4`,
    template: `<input id="val-42-input" data-role="input" data-clear-button="false" data-append="bitfield" type="number" >`,
    utils: ``
  },
  56: {
    key: `$56`,
    title: `Parking pull-out distance in mm`,
    description: ``,
    template: `<input id="val-56-input" data-role="input" data-clear-button="false" data-append="mm" type="number" >`,
    utils: ``
  },
  57: {
    key: `$57`,
    title: `Parking pull-out rate in mm/min`,
    description: ``,
    template: `<input id="val-57-input" data-role="input" data-clear-button="false" data-append="mm/min" type="number" >`,
    utils: ``
  },
  58: {
    key: `$58`,
    title: `Parking target in mm`,
    description: `Parking target in mm`,
    template: `<input id="val-58-input" data-role="input" data-clear-button="false" data-append="mm" type="number" >`,
    utils: ``
  },
  59: {
    key: `$59`,
    title: `Parking fast rate in mm/min`,
    description: `Parking fast rate in mm/min`,
    template: `<input id="val-59-input" data-role="input" data-clear-button="false" data-append="mm/min" type="number" >`,
    utils: ``
  },
  60: {
    key: `$60`,
    title: `Restore overrides`,
    description: `Restore overrides`,
    template: `<input id="val-60-input" data-role="input" data-clear-button="false" data-append="bool" type="number" >`,
    utils: ``
  },
  61: {
    key: `$61`,
    title: `Safety door options as bitfield`,
    description: `Ignore when idle (1), Keep coolant state on open (2)`,
    template: `<input id="val-61-input" data-role="input" data-clear-button="false" data-append="bitfield" type="number" >`,
    utils: ``
  },
  392: {
    key: `$392`,
    title: `Spindle on delay in s`,
    description: `Spindle on delay in s`,
    template: `<input id="val-392-input" data-role="input" data-clear-button="false" data-append="sec" type="number" >`,
    utils: ``
  },
  393: {
    key: `$393`,
    title: `Coolant on delay in s`,
    description: `Coolant on delay in s`,
    template: `<input id="val-393-input" data-role="input" data-clear-button="false" data-append="sec" type="number" >`,
    utils: ``
  }
}