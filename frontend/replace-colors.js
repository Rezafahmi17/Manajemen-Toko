const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

const colorMap = {
  '#0A1931': '#fcfbf7', // Background
  '#1A3D63': '#ffffff', // Cards
  '#4A7FA7': '#2b1b1b', // Borders
  '#B3CFE5': '#2b1b1b', // Secondary Text/Subtle
  '#F6FAFD': '#0d0d0f', // Primary Text
  // Let's also catch any leftovers
  '#02090a': '#fcfbf7',
  '#061a1c': '#ffffff',
  '#072720': '#ffffff',
  '#1e2c31': '#2b1b1b',
  '#000a1e': '#fcfbf7',
  '#133b32': '#2b1b1b',
  '#36f4a4': '#99ff66',
  '#99b3ad': '#2b1b1b',
};

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;
      
      for (const [oldColor, newColor] of Object.entries(colorMap)) {
        const regex = new RegExp(oldColor, 'gi');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  });
}

walkDir(directoryPath);
console.log('Done replacing colors.');
