MAX_ITERATIONS=${1:-20}
iteration=0

while [ $iteration -lt $MAX_ITERATIONS ]; do
  iteration=$((iteration + 1))
  echo "=== Iteration $iteration/$MAX_ITERATIONS ==="
  
  output=$(amp --dangerously-allow-all -x "$(cat prompt.md)" 2>&1 | tee /dev/tty)
  
  if echo "$output" | grep -q "DONEZO"; then
    echo "Task complete!"
    break
  fi
done

echo "Completed after $iteration iterations."