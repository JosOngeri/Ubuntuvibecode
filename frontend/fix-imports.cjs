const fs = require('fs');
const path = require('path');

/**
 * Safe import path migration script
 * Updates relative imports in feature folders to point to the correct location
 */

const FEATURES_DIR = path.join(__dirname, 'src', 'features');

// Files to skip (non-JS/JSX files)
const SKIP_EXTENSIONS = ['.css', '.md', '.json', '.svg', '.png', '.jpg'];

/**
 * Check if a file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return !SKIP_EXTENSIONS.includes(ext) && (ext === '.js' || ext === '.jsx');
}

/**
 * Update import paths in a single file
 */
function updateImportPaths(content, filePath) {
  const relativePath = path.relative(FEATURES_DIR, filePath);
  const depth = relativePath.split(path.sep).length - 1;
  
  // Calculate how many ../ we need to reach src/ from current location
  // features/recruitment/pages -> needs ../../../ to reach src/
  const requiredDepth = depth + 2; // +2 for features/ and the feature name folder
  const correctPath = '../'.repeat(requiredDepth);
  
  let lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match import statements with relative paths
    const importMatch = line.match(/^(import\s+.*?\s+from\s+['"])(\.\.\/[^'"]+)(['"])/);
    
    if (importMatch) {
      const before = importMatch[1];
      const oldPath = importMatch[2];
      const after = importMatch[3];
      
      // Skip if it's already pointing to features/ (feature-internal import)
      if (oldPath.includes('features/')) {
        continue;
      }
      
      // Skip if it's already using the correct path depth
      const currentDepth = (oldPath.match(/\.\.\//g) || []).length;
      if (currentDepth === requiredDepth) {
        continue;
      }
      
      // Update the path - remove all ../ and add the correct number
      const cleanPath = oldPath.replace(/^(\.\.\/)+/, '');
      const newPath = correctPath + cleanPath;
      lines[i] = before + newPath + after;
      modified = true;
      
      console.log(`  Updated: ${oldPath} -> ${newPath}`);
    }
  }
  
  return modified ? lines.join('\n') : content;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = updateImportPaths(content, filePath);
    
    if (updated !== content) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`✓ Updated: ${path.relative(FEATURES_DIR, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      processFile(fullPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('Starting import path migration...');
  console.log(`Target directory: ${FEATURES_DIR}`);
  console.log('');
  
  if (!fs.existsSync(FEATURES_DIR)) {
    console.error('Features directory not found!');
    process.exit(1);
  }
  
  processDirectory(FEATURES_DIR);
  
  console.log('');
  console.log('Migration complete!');
}

main();
