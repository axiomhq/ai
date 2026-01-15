#!/bin/bash

while true; do
  amp --dangerously-allow-all -x "$(cat prompt.md)"
done
