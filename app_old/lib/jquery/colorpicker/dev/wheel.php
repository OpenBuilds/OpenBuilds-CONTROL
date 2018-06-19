<?php
/**
 * Color Wheel Generator
 * 
 * This file is used only to generate color wheel image and not needed 
 * for the Wheel Color Picker plugin.
 * 
 * This script requires GD library.
 * 
 * Copyright © 2011 Fajar Yoseph Chandra. All rights reserved.
 * Licensed under MIT License.
 * http://www.opensource.org/licenses/mit-license.php
 */
 
/**
 * Converts hsv to rgb value
 * $h - Hue in degree [0, 360]
 * $s - Sat [0, 1]
 * $v - Value [0, 1]
 * Return: array of R, G, B
 */
function hsv2rgb($h, $s, $v) {
	$c = $v * $s;
	$h1 = $h/60;
	$x = $c * (1 - abs($h1 % 2 - 1));
	$rgb = array('r' => 0, 'g' => 0, 'b' => 0);
	if($h >= 0 && $h < 1) {
		$rgb[r] = $c;
		$rgb[g] = $x;
		$rgb[b] = 0;
	}
	elseif($h >= 1 && $h < 2) {
		$rgb[r] = $x;
		$rgb[g] = $c;
		$rgb[b] = 0;
	}
	elseif($h >= 2 && $h < 3) {
		$rgb[r] = 0;
		$rgb[g] = $c;
		$rgb[b] = $x;
	}
	elseif($h >= 3 && $h < 4) {
		$rgb[r] = 0;
		$rgb[g] = $x;
		$rgb[b] = $c;
	}
	elseif($h >= 4 && $h < 5) {
		$rgb[r] = $x;
		$rgb[g] = 0;
		$rgb[b] = $c;
	}
	elseif($h >= 5 && $h < 6) {
		$rgb[r] = $c;
		$rgb[g] = 0;
		$rgb[b] = $x;
	}
	$m = $v - $c;
	$rgb[r] = $rgb[r] + $m;
	$rgb[g] = $rgb[g] + $m;
	$rgb[b] = $rgb[b] + $m;
	return $rgb;
}

header("Content-type: image/png");
header("Content-disposition: inline; filename=wheel.png");

$w = isset($_REQUEST['w']) ? $_REQUEST['w'] : 256;
$h = isset($_REQUEST['h']) ? $_REQUEST['h'] : 256;
$center = array('x' => $w/2, 'y' => $h/2);
$r = ($w > $h) ? $h/2 : $w/2;

// Create transparent image
$img = imagecreatetruecolor($w, $h);
imagealphablending($img, false);
$background = imagecolorallocatealpha($img, 0, 0, 0, 127);
imagefill($img, 0, 0, $background);
imagealphablending($img, true);

// Circle
//imagefilledellipse($img, $center[x], $center[y], $r*2, $r*2, 0x00000000);

// Fill the wheel with colors
for($y = 0; $y < $h; $y++) {
	for($x = 0; $x < $h; $x++) {
		// Get the offset from central position
		$offset = sqrt(pow($x-$center['x'], 2) + pow($y-$center['y'], 2));
		
		// Skip pixel outside the circle area
		if($offset > $r)
			continue;
			
		// Get the position degree (hue)
		$deg = (
			($x-$center['x'] == 0 
				? ($y < $center['x'] ? 90 : 270)
				: rad2deg(atan(($center['y']-$y)/($x-$center['x'])))
			)
			+($x < $center['x'] ? 180 : 0)
			+360
		)%360;
		
		// Relative Offset (sat)
		$sat = $offset/$r;
		
		// Value is always 1
		$val = 1;
		
		// Calculate color
		$cr = (abs($deg+360)+60)%360 < 120 ? 1
			: ($deg > 240 ? (120-abs($deg-360))/60 
			: ($deg < 120 ? (120-$deg)/60
			: 0));
		$cg = abs($deg-120) < 60 ? 1
			: (abs($deg-120) < 120 ? (120-abs($deg-120))/60 
			: 0);
		$cb = abs($deg-240) < 60 ? 1
			: (abs($deg-240) < 120 ? (120-abs($deg-240))/60 
			: 0);
		$pr = ($cr + (1-$cr)*(1-$sat)) * 255;
		$pg = ($cg + (1-$cg)*(1-$sat)) * 255;
		$pb = ($cb + (1-$cb)*(1-$sat)) * 255;
		$rgb = sprintf("0x%02x%02x%02x", $pr, $pg, $pb);
		imagesetpixel($img, $x, $y, $rgb);
	}
}

// Border
//imageellipse($img, $center[x], $center[y], $r*2, $r*2, 0x00000000);

// Output resulting image
imagesavealpha($img, true);
imagepng($img);
imagedestroy($img);
