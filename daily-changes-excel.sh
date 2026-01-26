#!/bin/bash

OUTPUT_FILE="daily-changes-report.csv"
CURRENT_BRANCH=$(git branch --show-current)

echo "Date,Branch,Commit Summary,Insertions,Deletions,Total Changes" > "$OUTPUT_FILE"

user_insertions=0
user_deletions=0
user_total=0
commit_count=0

# Use process substitution (NO subshell)
while read date; do

  stats=$(git log --since="$date 00:00" --until="$date 23:59" --shortstat)
  commits=$(git log --since="$date 00:00" --until="$date 23:59" --pretty=format:"%s")

  [ -z "$stats" ] && continue

  summary=$(echo "$commits" | head -1)

  insertions=$(echo "$stats" | grep -o '[0-9]\+ insertion' | grep -o '[0-9]\+' | awk '{s+=$1} END {print s+0}')
  deletions=$(echo "$stats" | grep -o '[0-9]\+ deletion' | grep -o '[0-9]\+' | awk '{s+=$1} END {print s+0}')

  total=$((insertions + deletions))

  echo "\"$date\",\"$CURRENT_BRANCH\",\"$summary\",\"$insertions\",\"$deletions\",\"$total\"" >> "$OUTPUT_FILE"

  user_insertions=$((user_insertions + insertions))
  user_deletions=$((user_deletions + deletions))
  user_total=$((user_total + total))
  commit_count=$((commit_count + 1))

done < <(git log --since="4 months ago" --pretty=format:"%ad" --date=short | sort -u)

# Repository totals (ALL branches)
repo_stats=$(git log --since="4 months ago" --shortstat --all)

repo_insertions=$(echo "$repo_stats" | grep -o '[0-9]\+ insertion' | grep -o '[0-9]\+' | awk '{s+=$1} END {print s+0}')
repo_deletions=$(echo "$repo_stats" | grep -o '[0-9]\+ deletion' | grep -o '[0-9]\+' | awk '{s+=$1} END {print s+0}')
repo_total=$((repo_insertions + repo_deletions))

# Contribution %
contrib_insertions=$(awk "BEGIN {printf \"%.2f\", ($user_insertions/$repo_insertions)*100}")
contrib_deletions=$(awk "BEGIN {printf \"%.2f\", ($user_deletions/$repo_deletions)*100}")

echo "" >> "$OUTPUT_FILE"
echo "\"TOTAL\",\"\",\"\",\"$user_insertions\",\"$user_deletions\",\"$user_total\"" >> "$OUTPUT_FILE"
echo "\"Repository Total (sample of $commit_count commits across all branches)\",\"\",\"\",\"$repo_insertions\",\"$repo_deletions\",\"$repo_total\"" >> "$OUTPUT_FILE"
echo "\"Your Contribution %\",\"\",\"\",\"$contrib_insertions%\",\"$contrib_deletions%\",\"\"" >> "$OUTPUT_FILE"

echo "✅ Fixed Excel report generated: $OUTPUT_FILE"
