#!/bin/bash

OUTPUT_FILE="daily-work-report.csv"

# CSV Header
echo "Date,Files Modified,Commits,Summary" > $OUTPUT_FILE

git log --since="4 months ago" --pretty=format:"%ad" --date=short | sort -u | while read date; do

  files_changed=$(git log --since="$date 00:00" --until="$date 23:59" --name-only --pretty=format: | sort -u | tr '\n' '|' | sed 's/|$//')

  commits=$(git log --since="$date 00:00" --until="$date 23:59" --pretty=format:"%s" | tr '\n' '|' | sed 's/|$//')

  summary=$(git log --since="$date 00:00" --until="$date 23:59" --stat --pretty=format:"" | tr '\n' ' ' | sed 's/  */ /g')

  if [ -z "$files_changed" ]; then
    files_changed="No changes"
  fi

  if [ -z "$commits" ]; then
    commits="No commits"
  fi

  if [ -z "$summary" ]; then
    summary="No summary"
  fi

  echo "\"$date\",\"$files_changed\",\"$commits\",\"$summary\"" >> $OUTPUT_FILE

done

echo "Excel report generated: $OUTPUT_FILE"
