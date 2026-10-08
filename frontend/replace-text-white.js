const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'app');

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let updated = false;
      if (content.includes('text-white')) {
        content = content.replace(/text-white/g, 'text-[#0d0d0f]');
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  });
}

walkDir(directoryPath);
console.log('Done replacing text-white.');
