#!/bin/bash
# Daily Work Summary Script

echo "=== Daily Work Summary for Last 4 Months ==="
echo ""

git log --since="4 months ago" --pretty=format:"%ad" --date=short | sort -u | while read date; do
  echo "=== $date ==="

  files_changed=$(git log --since="$date 00:00" --until="$date 23:59" --name-only --pretty=format: | sort -u | grep -v '^$')

  if [ ! -z "$files_changed" ]; then
    echo "Files modified:"
    echo "$files_changed"

    commits=$(git log --since="$date 00:00" --until="$date 23:59" --pretty=format:"- %s")
    if [ ! -z "$commits" ]; then
      echo "Commits:"
      echo "$commits"
    fi

    echo "Summary:"
    git log --since="$date 00:00" --until="$date 23:59" --stat --pretty=format:"%s" | head -10
  else
    echo "No changes recorded"
  fi

  echo ""
  echo "---"
  echo ""
done
