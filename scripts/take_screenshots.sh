#!/bin/bash
ADB="/c/Users/Labs/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DIR="C:/Users/Labs/flexmenow/screenshots"

screenshot() {
  local name="$1"
  MSYS_NO_PATHCONV=1 $ADB shell screencap /sdcard/screen.png
  MSYS_NO_PATHCONV=1 $ADB pull /sdcard/screen.png "$DIR/${name}.png" 2>&1 | tail -1
}

tap() {
  $ADB shell input tap "$1" "$2"
  sleep 2
}

back() {
  $ADB shell input keyevent 4
  sleep 1
}

swipe_up() {
  $ADB shell input swipe 540 1800 540 600 300
  sleep 1
}

# 1. Current screen
screenshot "01_current"
echo "=== 01 current ==="

# 2. Navigate tabs - SHOT tab (should already be here)
# Bottom nav: LOCKET ~135, SHOT ~405, TALE ~675, ME ~945 (y ~2350)
tap 405 2350
sleep 2
screenshot "02_shot_tab"
echo "=== 02 shot tab ==="

# 3. Scroll down on shot tab
swipe_up
screenshot "03_shot_scroll"
echo "=== 03 shot scroll ==="

# 4. TALE tab
tap 675 2350
sleep 3
screenshot "04_tale_tab"
echo "=== 04 tale tab ==="

# 5. Scroll down on tale tab
swipe_up
screenshot "05_tale_scroll"
echo "=== 05 tale scroll ==="

# 6. LOCKET tab
tap 135 2350
sleep 2
screenshot "06_locket_tab"
echo "=== 06 locket tab ==="

# 7. ME tab
tap 945 2350
sleep 3
screenshot "07_me_tab"
echo "=== 07 me tab ==="

# 8. Scroll down on me tab
swipe_up
screenshot "08_me_scroll"
echo "=== 08 me scroll ==="

# 9. Tap bell icon (notifications) - top right area
tap 920 100
sleep 2
screenshot "09_notifications"
echo "=== 09 notifications ==="

# 10. Close notification sheet
back
sleep 1

# 11. Tap settings icon - top right
tap 990 100
sleep 2
screenshot "10_settings"
echo "=== 10 settings ==="

# 12. Close settings
back
sleep 1

# 13. Tap Edit Profile button
tap 540 850
sleep 2
screenshot "11_edit_profile"
echo "=== 11 edit profile ==="

# Close
back
sleep 1

# 14. Back to SHOT tab, tap on a template card
tap 405 2350
sleep 2
# Tap on first visible template card (roughly center of screen)
tap 270 1200
sleep 3
screenshot "12_shot_detail"
echo "=== 12 shot detail ==="

# 15. Back
back
sleep 1

echo "=== DONE ==="
