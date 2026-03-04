#!/bin/bash
ADB="/c/Users/Labs/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DIR="C:/Users/Labs/flexmenow/screenshots"

sc() {
  MSYS_NO_PATHCONV=1 $ADB shell screencap /sdcard/screen.png
  MSYS_NO_PATHCONV=1 $ADB pull /sdcard/screen.png "$DIR/$1.png" 2>&1 | tail -1
  echo "=== $1 ==="
}

# Bottom nav: LOCKET=135 SHOT=405 TALE=675 ME=945, Y=2350
NAV_Y=2350

# 1. SHOT tab (already here)
sc "01_shot_tab"

# 2. Scroll SHOT down
$ADB shell input swipe 540 1500 540 500 300
sleep 2
sc "02_shot_scroll"

# Scroll back up
$ADB shell input swipe 540 500 540 1500 300
sleep 1

# 3. TALE tab
$ADB shell input tap 675 $NAV_Y
sleep 3
sc "03_tale_tab"

# 4. Scroll TALE down
$ADB shell input swipe 540 1500 540 500 300
sleep 2
sc "04_tale_scroll"

# Scroll back
$ADB shell input swipe 540 500 540 1500 300
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
$ADB shell input swipe 540 1500 540 500 300
sleep 2
sc "07_me_scroll"

# Scroll back
$ADB shell input swipe 540 500 540 1500 300
sleep 1

# 8. Tap bell icon (notifications) top-right
$ADB shell input tap 980 100
sleep 2
sc "08_notifications"

# Close
$ADB shell input keyevent 4
sleep 1

# 9. Go to SHOT tab, tap first template card
$ADB shell input tap 405 $NAV_Y
sleep 2
# Tap first trending card (bottom-left area)
$ADB shell input tap 160 1700
sleep 3
sc "09_shot_detail"

# 10. Back to shot
$ADB shell input keyevent 4
sleep 2

# 11. Tap hero card (the big spotlight card)
$ADB shell input tap 540 250
sleep 3
sc "10_shot_detail_hero"

# Back
$ADB shell input keyevent 4
sleep 2

echo "=== ALL DONE ==="
