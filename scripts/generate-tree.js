import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'FOLDER_TREE_AUTO.TXT');

// Directories to ignore to keep the output clean
const IGNORE_LIST = ['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'coverage', '.cache', '.vscode', 'scripts'];

function generateTree(dir, prefix = '') {
  let result = '';
  const items = fs.readdirSync(dir)
    .filter(item => !IGNORE_LIST.includes(item))
    .sort((a, b) => {
      const isDirA = fs.statSync(path.join(dir, a)).isDirectory();
      const isDirB = fs.statSync(path.join(dir, b)).isDirectory();
      // Sort folders first, then files
      if (isDirA && !isDirB) return -1;
      if (!isDirA && isDirB) return 1;
      return a.localeCompare(b);
    });

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const itemPath = path.join(dir, item);
    const isDir = fs.statSync(itemPath).isDirectory();
    
    const marker = isLast ? '└── ' : '├── ';
    result += `${prefix}${marker}${item}${isDir ? '/' : ''}\n`;
    
    if (isDir) {
      result += generateTree(itemPath, prefix + (isLast ? '    ' : '│   '));
    }
  });
  return result;
}

const treeOutput = "henna-by-falina/\n" + generateTree(ROOT_DIR);
fs.writeFileSync(OUTPUT_FILE, treeOutput);
console.log('✅ Auto-generated folder tree saved to FOLDER_TREE_AUTO.TXT');