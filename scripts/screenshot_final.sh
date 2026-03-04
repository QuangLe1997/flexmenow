#!/bin/bash
ADB="/c/Users/Labs/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DIR="C:/Users/Labs/flexmenow/screenshots"

sc() {
  MSYS_NO_PATHCONV=1 $ADB shell screencap /sdcard/screen.png
  MSYS_NO_PATHCONV=1 $ADB pull /sdcard/screen.png "$DIR/$1.png" 2>&1 | tail -1
  echo "=== $1 ==="
}

# Bottom nav Y=2200 (3-button nav mode)
# X centers: LOCKET=135 SHOT=270 TALE=540 ME=810
# Actually from screenshot: LOCKET~90, SHOT~270, TALE~450, ME~630
# With 1080px / 4 tabs = 270px each, centers at 135, 405, 675, 945
# But the tap test showed TALE at x=675 didn't work well, let me use visible positions
# From the screenshot: LOCKET≈90*1.2=108, SHOT≈270*1.2=324, TALE≈445*1.2=534, ME≈625*1.2=750
# Wait no - the tabs use Expanded so each is 270px wide. Centers: 135, 405, 675, 945
# Y=2200 confirmed working. Let's use the standard X positions.
NAV_Y=2200

# 1. SHOT tab (should already be here)
sleep 2
sc "01_shot_tab"

# 2. Scroll SHOT down
$ADB shell input swipe 540 1500 540 700 300
sleep 2
sc "02_shot_scroll"

# Scroll back up
$ADB shell input swipe 540 700 540 1500 300
sleep 1

# 3. TALE tab
$ADB shell input tap 675 $NAV_Y
sleep 4
sc "03_tale_tab"

# 4. Scroll TALE down
$ADB shell input swipe 540 1500 540 700 300
sleep 2
sc "04_tale_scroll"

# Scroll back
$ADB shell input swipe 540 700 540 1500 300
sleep 1

# 5. LOCKET tab
$ADB shell input tap 135 $NAV_Y
sleep 3
sc "05_locket_tab"

# 6. ME tab
$ADB shell input tap 945 $NAV_Y
sleep 3
sc "06_me_tab"

# 7. Scroll ME down
$ADB shell input swipe 540 1500 540 700 300
sleep 2
sc "07_me_scroll"

# Scroll back
$ADB shell input swipe 540 700 540 1500 300
sleep 1

# 8. Back to SHOT, tap first trending card
$ADB shell input tap 405 $NAV_Y
sleep 3
$ADB shell input tap 160 1600
sleep 3
sc "08_shot_detail"

# 9. Back
$ADB shell input keyevent 4
sleep 2

echo "=== ALL DONE ==="
