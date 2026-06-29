const fs = require('fs');
const glob = require('glob');

const files = [
  'utils/storage.ts',
  'components/home/HorizontalCalendar.tsx',
  'components/progress/RecordsLog.tsx',
  'components/progress/HourlyHeatmap.tsx',
  'components/progress/ActivityHeatmap.tsx',
  'components/home/LogList.tsx',
  'app/pages/plan/plan.tsx',
  'app/pages/progress/progress.tsx',
  'app/pages/home/home.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  // Add import if not present
  if (content.includes("toISOString().split('T')[0]") && !content.includes("getLocalDateString")) {
    const importStmt = "import { getLocalDateString } from '@/utils/date';\n";
    // Find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + importStmt + content.slice(endOfLine + 1);
    } else {
      content = importStmt + content;
    }
  }

  // Replace new Date().toISOString().split('T')[0]
  content = content.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getLocalDateString()');
  
  // Replace variable.toISOString().split('T')[0]
  content = content.replace(/([a-zA-Z0-9_]+)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getLocalDateString($1)');
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});
