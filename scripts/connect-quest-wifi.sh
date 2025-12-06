#!/bin/bash

# connect-quest-wifi.sh - Connect Meta Quest to WiFi via ADB
# Usage: ./scripts/connect-quest-wifi.sh [SSID] [PASSWORD]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Quest WiFi Connection Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if ADB is installed
if ! command -v adb &> /dev/null; then
  echo -e "${RED}❌ ADB not found!${NC}"
  echo -e "${YELLOW}Install Android Platform Tools:${NC}"
  echo -e "  macOS: brew install android-platform-tools"
  echo -e "  Or download from: https://developer.android.com/studio/releases/platform-tools"
  exit 1
fi

echo -e "${GREEN}✓ ADB found: $(adb --version | head -1)${NC}"
echo ""

# Get WiFi credentials
if [ -z "$1" ] || [ -z "$2" ]; then
  echo -e "${YELLOW}Usage: $0 <SSID> <PASSWORD>${NC}"
  echo ""
  echo -e "${BLUE}Example:${NC}"
  echo -e "  $0 'MyHomeWiFi' 'mypassword123'"
  echo ""
  exit 1
fi

WIFI_SSID="$1"
WIFI_PASSWORD="$2"

echo -e "${BLUE}📡 Connecting to WiFi:${NC} $WIFI_SSID"
echo ""

# Check if device is connected
echo -e "${YELLOW}🔍 Checking ADB connection...${NC}"
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICE_COUNT" -eq "0" ]; then
  echo -e "${RED}❌ No Quest device found!${NC}"
  echo ""
  echo -e "${YELLOW}Connect your Quest via USB and enable USB debugging:${NC}"
  echo -e "  1. Connect Quest to Mac via USB-C cable"
  echo -e "  2. Put on headset and allow USB debugging when prompted"
  echo -e "  3. Run: adb devices"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Quest device connected${NC}"
echo ""

# Enable WiFi
echo -e "${YELLOW}📶 Enabling WiFi...${NC}"
adb shell svc wifi enable
sleep 2
echo -e "${GREEN}✓ WiFi enabled${NC}"
echo ""

# Connect to network
echo -e "${YELLOW}🔐 Connecting to '$WIFI_SSID'...${NC}"

# Try new Android 10+ command first
if adb shell cmd -w wifi connect-network "$WIFI_SSID" wpa2 "$WIFI_PASSWORD" 2>/dev/null; then
  echo -e "${GREEN}✓ Connected successfully!${NC}"
else
  # Fallback for older Android versions
  echo -e "${YELLOW}⚠️  New command failed, trying legacy method...${NC}"

  # Create wpa_supplicant config
  CONFIG="network={
    ssid=\"$WIFI_SSID\"
    psk=\"$WIFI_PASSWORD\"
    key_mgmt=WPA-PSK
  }"

  # Write config to device
  adb shell "echo '$CONFIG' > /data/misc/wifi/wpa_supplicant.conf"
  adb shell svc wifi disable
  sleep 1
  adb shell svc wifi enable
  sleep 3

  echo -e "${GREEN}✓ WiFi configured (legacy method)${NC}"
fi

echo ""

# Check connection status
echo -e "${YELLOW}📊 Checking connection status...${NC}"
sleep 3

WIFI_STATUS=$(adb shell dumpsys wifi | grep "mNetworkInfo" | head -1 || echo "unknown")

if echo "$WIFI_STATUS" | grep -q "CONNECTED"; then
  echo -e "${GREEN}✅ Quest is connected to WiFi!${NC}"
  echo ""

  # Get IP address
  IP_ADDRESS=$(adb shell ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d'/' -f1 || echo "unknown")

  if [ "$IP_ADDRESS" != "unknown" ]; then
    echo -e "${BLUE}📍 Quest IP Address:${NC} $IP_ADDRESS"
    echo ""
    echo -e "${GREEN}💡 You can now use ADB over WiFi:${NC}"
    echo -e "  1. adb tcpip 5555"
    echo -e "  2. adb connect $IP_ADDRESS:5555"
    echo -e "  3. Disconnect USB cable"
    echo ""
  fi

  exit 0
else
  echo -e "${RED}❌ Connection failed or still connecting...${NC}"
  echo ""
  echo -e "${YELLOW}Full WiFi status:${NC}"
  adb shell dumpsys wifi | grep -A 5 "mNetworkInfo" || echo "Could not get WiFi status"
  echo ""
  echo -e "${YELLOW}💡 Troubleshooting:${NC}"
  echo -e "  - Check WiFi password is correct"
  echo -e "  - Check WiFi is 2.4GHz (Quest may not support 5GHz on some routers)"
  echo -e "  - Try manually connecting via Quest Settings > WiFi"
  echo ""
  exit 1
fi
