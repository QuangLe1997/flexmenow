#!/bin/bash
ADB="/c/Users/Labs/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DIR="C:/Users/Labs/flexmenow/screenshots"

sc() {
  MSYS_NO_PATHCONV=1 $ADB shell screencap /sdcard/screen.png
  MSYS_NO_PATHCONV=1 $ADB pull /sdcard/screen.png "$DIR/$1.png" 2>&1 | tail -1
  echo "=== $1 ==="
}

# Get screen size
SIZE=$($ADB shell wm size 2>&1 | grep -oP '\d+x\d+' | tail -1)
echo "Screen: $SIZE"

# Bottom nav Y is at the very bottom ~2340 for 1080x2400
# LOCKET=135 SHOT=405 TALE=675 ME=945

# 1. SHOT tab (current)
sc "s01_shot_tab"

# 2. Scroll SHOT tab down
$ADB shell input swipe 540 1500 540 500 300
sleep 2
sc "s02_shot_scroll"

# Scroll back up
$ADB shell input swipe 540 500 540 1500 300
sleep 1

# 3. TALE tab
$ADB shell input tap 675 2340
sleep 3
sc "s03_tale_tab"

# 4. Scroll TALE down
$ADB shell input swipe 540 1500 540 500 300
sleep 2
sc "s04_tale_scroll"

# Scroll back
$ADB shell input swipe 540 500 540 1500 300
sleep 1

# 5. LOCKET tab
$ADB shell input tap 135 2340
sleep 2
sc "s05_locket_tab"

# 6. ME tab
$ADB shell input tap 945 2340
sleep 3
sc "s06_me_tab"

# 7. Scroll ME down
$ADB shell input swipe 540 1500 540 500 300
sleep 2
sc "s07_me_scroll"

# Scroll back
$ADB shell input swipe 540 500 540 1500 300
sleep 1

# 8. Tap bell icon (top-right area, around x=880 y=130)
$ADB shell input tap 880 130
sleep 2
sc "s08_notifications"

# Close bottom sheet (tap outside / back)
$ADB shell input keyevent 4
sleep 1

# 9. Tap settings icon (further right, around x=960 y=130)
$ADB shell input tap 960 130
sleep 2
sc "s09_settings"

# Close
$ADB shell input keyevent 4
sleep 1

# 10. Tap "Edit Profile" button (center of profile card, ~y=750)
$ADB shell input tap 540 750
sleep 2
sc "s10_edit_profile"

# Close
$ADB shell input keyevent 4
sleep 1

# 11. Go to SHOT, tap a template card
$ADB shell input tap 405 2340
sleep 2
# Scroll to trending, tap first card
$ADB shell input swipe 540 1500 540 800 300
sleep 1
$ADB shell input tap 140 1400
sleep 3
sc "s11_shot_detail"

# 12. Back to shot tab
$ADB shell input keyevent 4
sleep 2

echo "=== ALL DONE ==="
