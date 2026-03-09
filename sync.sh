#!/bin/bash
REMOTE="quang@100.103.199.111"
PROJECT="/c/Users/Labs/flexmenow"

echo "Syncing flexmenow → macOS via tar+ssh..."

cd "$PROJECT"

tar cf - \
  --exclude='.dart_tool' \
  --exclude='build' \
  --exclude='.gradle' \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='ios/Pods' \
  --exclude='generated_images' \
  --exclude='nul' \
  --exclude='screenshots' \
  --exclude='.next' \
  --exclude='gradle.properties' \
  --exclude='.dart_tool' \
  . | ssh $REMOTE "mkdir -p ~/flexmenow && cd ~/flexmenow && tar xf -"

echo "Sync done!"
