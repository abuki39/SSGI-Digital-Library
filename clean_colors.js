const fs = require('fs');
const path = require('path');

const dashboards = ['StaffDashboard', 'LibrarianDashboard', 'AdminDashboard'];

dashboards.forEach(name => {
  const jsxPath = path.join(__dirname, 'frontend/src/components', `${name}.jsx`);
  
  if (fs.existsSync(jsxPath)) {
    let content = fs.readFileSync(jsxPath, 'utf8');
    
    // Regex to match style={{ ... }} 
    content = content.replace(/style=\{\{([\s\S]*?)\}\}/g, (match, inner) => {
        // If the inner style contains color, background, or backgroundColor, let's strip those properties out
        let newInner = inner
            .replace(/color:\s*["'][^"']+["'],?/g, '')
            .replace(/backgroundColor:\s*["'][^"']+["'],?/g, '')
            .replace(/background:\s*["'][^"']+["'],?/g, '')
            .trim();
            
        // If the style object becomes empty (e.g. style={{}}) we just return empty string
        if (newInner === '' || newInner === ',' || newInner === ' ') {
            return '';
        }
        
        // Clean up trailing commas
        newInner = newInner.replace(/,\s*$/, '');
        return `style={{ ${newInner} }}`;
    });

    fs.writeFileSync(jsxPath, content);
    console.log(`Cleaned up hardcoded colors in ${name}.jsx`);
  }
});
