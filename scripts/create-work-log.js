const fs = require('fs');
const path = require('path');

const featureName = process.argv[2];
if (!featureName) {
  console.error('Please provide a feature name');
  process.exit(1);
}

const date = new Date();
const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
const slug = featureName.toLowerCase().replace(/\s+/g, '-');
const fileName = `${dateStr}-${slug}.md`;
const filePath = path.join(__dirname, '..', 'docs', 'work-logs', fileName);

// Ensure the work-logs directory exists
const workLogsDir = path.join(__dirname, '..', 'docs', 'work-logs');
if (!fs.existsSync(workLogsDir)) {
  fs.mkdirSync(workLogsDir, { recursive: true });
}

const template = `<!-- filepath: ${filePath.replace(/\\/g, '/')} -->
# ${featureName}

## Decisions Made:
1. **First Decision**:
   - Detail 1
   - Detail 2

2. **Second Decision**:
   - Detail 1
   - Detail 2

## Technical Details:
- Technical detail 1
- Technical detail 2

## Implementation Challenges:
1. **Challenge 1**:
   - Solution 1
   - Solution 2

2. **Challenge 2**:
   - Solution 1
   - Solution 2
`;

fs.writeFileSync(filePath, template);
console.log(`Created new work log: ${filePath}`);

// Now update the index file
const indexPath = path.join(__dirname, '..', 'docs', 'work-log-index.md');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const dayMonthYear = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Format the new entry with relative path to work log file
const newEntry = `- [${featureName}](./work-logs/${fileName})`;

// Check if the month+year header exists
if (!indexContent.includes(`## ${monthYear}`)) {
  // Add new month section
  const updatedContent = `${indexContent}\n\n## ${monthYear}\n\n### ${dayMonthYear}\n${newEntry}`;
  fs.writeFileSync(indexPath, updatedContent);
} else {
  // Check if the day header exists
  if (!indexContent.includes(`### ${dayMonthYear}`)) {
    // Add new day section within the existing month
    const monthSectionIndex = indexContent.indexOf(`## ${monthYear}`);
    const nextSectionMatch = indexContent.slice(monthSectionIndex + monthYear.length + 3).match(/\n## /);
    
    let insertPosition;
    if (nextSectionMatch) {
      insertPosition = monthSectionIndex + monthYear.length + 3 + nextSectionMatch.index;
      const updatedContent = 
        indexContent.slice(0, insertPosition) + 
        `\n\n### ${dayMonthYear}\n${newEntry}` + 
        indexContent.slice(insertPosition);
      fs.writeFileSync(indexPath, updatedContent);
    } else {
      // No next section, append to the end of the month section
      const updatedContent = `${indexContent}\n\n### ${dayMonthYear}\n${newEntry}`;
      fs.writeFileSync(indexPath, updatedContent);
    }
  } else {
    // Add to existing day section
    const dayHeaderIndex = indexContent.indexOf(`### ${dayMonthYear}`);
    const nextHeaderMatch = indexContent.slice(dayHeaderIndex + dayMonthYear.length + 4).match(/\n### |\n## /);
    
    let insertPosition;
    if (nextHeaderMatch) {
      insertPosition = dayHeaderIndex + dayMonthYear.length + 4 + nextHeaderMatch.index;
      const updatedContent = 
        indexContent.slice(0, insertPosition) + 
        `\n${newEntry}` + 
        indexContent.slice(insertPosition);
      fs.writeFileSync(indexPath, updatedContent);
    } else {
      // No next header, append to the end of the day section
      const updatedContent = `${indexContent}\n${newEntry}`;
      fs.writeFileSync(indexPath, updatedContent);
    }
  }
}

console.log(`Updated index: ${indexPath}`);
console.log(`\nUsage instructions for the work log:`);
console.log(`1. Edit the newly created file: ${filePath}`);
console.log(`2. Replace the template content with your actual work log details`);
console.log(`3. Commit both the new log file and the updated index`);
