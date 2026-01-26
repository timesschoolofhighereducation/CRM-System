#!/bin/bash

OUTPUT="daily-contribution-report.csv"

# Excel header
echo "Date,Contribution Summary,Files Changed,Commit Messages" > "$OUTPUT"

git log --since="4 months ago" --pretty=format:"%ad" --date=short | sort -u | while read date; do

  files=$(git log --since="$date 00:00" --until="$date 23:59" \
    --name-only --pretty=format: | sort -u | tr '\n' '|' | sed 's/|$//')

  commits=$(git log --since="$date 00:00" --until="$date 23:59" \
    --pretty=format:"%s" | tr '\n' '|' | sed 's/|$//')

  summary=$(git log --since="$date 00:00" --until="$date 23:59" \
    --pretty=format:"%s" | head -1)

  # Skip empty days
  if [ -z "$files" ] && [ -z "$commits" ]; then
    continue
  fi

  [ -z "$files" ] && files="No file changes"
  [ -z "$commits" ] && commits="No commits"
  [ -z "$summary" ] && summary="Development work"

  echo "\"$date\",\"$summary\",\"$files\",\"$commits\"" >> "$OUTPUT"

done

echo "✅ Excel contribution report created: $OUTPUT"
