#!/bin/bash
# Upload APK to Contabo Server
# Run this script locally to upload the built APK to Contabo

# Configuration - Update these values
CONTABO_USER="your-username"
CONTABO_IP="your-contabo-ip"
APK_PATH="../../Ubuntu APP/app/build/outputs/apk/release/app-release.apk"
APK_NAME="ubuntu-hrms-latest.apk"

echo "Uploading Ubuntu HRMS APK to Contabo..."

# Check if APK exists
if [ ! -f "$APK_PATH" ]; then
    echo "✗ APK not found at: $APK_PATH"
    echo "Please build the APK first using: scripts/build-release.sh"
    exit 1
fi

# Upload APK
scp "$APK_PATH" $CONTABO_USER@$CONTABO_IP:/var/www/ubuntu-hrms/apk/$APK_NAME

if [ $? -eq 0 ]; then
    echo "✓ APK uploaded successfully!"
    echo "Download URL: http://$CONTABO_IP/apk/$APK_NAME"
    
    # Set permissions
    ssh $CONTABO_USER@$CONTABO_IP "chmod 644 /var/www/ubuntu-hrms/apk/$APK_NAME"
else
    echo "✗ Upload failed!"
    exit 1
fi
