const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../out');
const routesToClean = ['copies', 'teachers', 'copy-types', 'reports'];

routesToClean.forEach(route => {
  const routePath = path.join(outDir, route);
  if (fs.existsSync(routePath)) {
    fs.rmSync(routePath, { recursive: true, force: true });
    console.log(`Cleaned: ${route}`);
  }
});

console.log('Build cleanup completed');
