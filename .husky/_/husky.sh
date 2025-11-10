#!/bin/sh
# Husky placeholder script for POSIX sh compatibility.
# It provides a hook for per-user configuration (optional).
if [ -f "$HOME/.huskyrc" ]; then
  . "$HOME/.huskyrc"
fi
