<?
/**
 * Crosshair Generator
 * 
 * This file is used only to generate crosshair image and not needed 
 * for the Wheel Color Picker plugin.
 * 
 * Copyright © 2011 Fajar Yoseph Chandra. All rights reserved.
 * Licensed under MIT License.
 * http://www.opensource.org/licenses/mit-license.php
 */
 
header("Content-type: image/png");
header("Content-disposition: inline; filename=cross.png");

// Create transparent image
$img = imagecreatetruecolor(11, 11);
imagealphablending($img, false);
$background = imagecolorallocatealpha($img, 0, 0, 0, 127);
imagefill($img, 0, 0, $background);
imagealphablending($img, true);

imagesetthickness($img, 5);
imageellipse($img, 5, 5, 11, 11, 0x0);
imageellipse($img, 5, 5, 9, 9, 0x0);
imageellipse($img, 5, 5, 7, 7, 0x0);

// Output resulting image
imagesavealpha($img, true);
imagepng($img);
imagedestroy($img);
