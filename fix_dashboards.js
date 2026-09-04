const fs = require('fs');
const path = require('path');

const dashboards = ['StaffDashboard', 'LibrarianDashboard', 'AdminDashboard'];

dashboards.forEach(name => {
  const jsxPath = path.join(__dirname, 'frontend/src/components', `${name}.jsx`);
  const cssPath = path.join(__dirname, 'frontend/src/components', `${name}.module.css`);
  
  if (fs.existsSync(jsxPath)) {
    let content = fs.readFileSync(jsxPath, 'utf8');
    
    // Add darkTheme class to root layout
    if (name === 'StaffDashboard') {
        content = content.replace(/className=\{styles\.staffLayout\}/, 'className={`${styles.staffLayout} ${isDark ? styles.darkTheme : ""}`}');
    } else if (name === 'LibrarianDashboard') {
        content = content.replace(/className=\{styles\.librarianLayout\}/, 'className={`${styles.librarianLayout} ${isDark ? styles.darkTheme : ""}`}');
    } else if (name === 'AdminDashboard') {
        content = content.replace(/className=\{styles\.adminLayout\}/, 'className={`${styles.adminLayout} ${isDark ? styles.darkTheme : ""}`}');
    }
    
    // Remove all style={...} blocks that contain isDark or bgDashboard/textDashboard
    // This regex matches style={{ ... }} spanning multiple lines
    content = content.replace(/style=\{\{[\s\S]*?\}\}/g, match => {
        if (match.includes('isDark') || match.includes('bgDashboard') || match.includes('textDashboard')) {
            // we remove the style attribute entirely
            return '';
        }
        return match;
    });

    fs.writeFileSync(jsxPath, content);
    console.log(`Updated ${name}.jsx`);
  }
  
  if (fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Append dark theme rules
    const darkRules = `
/* Dark Theme Overrides */
.darkTheme {
  background-color: #1a202c;
  color: #f7fafc;
  min-height: 100vh;
}

.darkTheme header,
.darkTheme .staffHeader,
.darkTheme .librarianHeader,
.darkTheme .adminHeader {
  background-color: #2d3748;
  color: #f7fafc;
  border-bottom: 1px solid #4a5568;
}

.darkTheme .card,
.darkTheme .docCard,
.darkTheme .statCard,
.darkTheme .dashboardCard {
  background-color: #2d3748;
  color: #f7fafc;
  border: 1px solid #4a5568;
}

.darkTheme h2, 
.darkTheme h3, 
.darkTheme .docTitle,
.darkTheme .statNumber {
  color: #ffffff;
}

.darkTheme p,
.darkTheme .docMeta p,
.darkTheme .docMeta strong,
.darkTheme label,
.darkTheme .statLabel {
  color: #e2e8f0;
}

.darkTheme .docCategory {
  background-color: #4a5568;
  color: #f7fafc;
}

.darkTheme .modalContent,
.darkTheme .viewerContent {
  background-color: #2d3748;
  color: #f7fafc;
  border: 1px solid #4a5568;
}

.darkTheme input,
.darkTheme select,
.darkTheme textarea {
  background-color: #4a5568;
  color: #ffffff;
  border: 1px solid #718096;
}

.darkTheme input::placeholder {
  color: #a0aec0;
}

.darkTheme table {
  background-color: #2d3748;
  color: #f7fafc;
}

.darkTheme th {
  background-color: #4a5568;
  color: #ffffff;
}

.darkTheme td {
  border-bottom: 1px solid #4a5568;
  color: #e2e8f0;
}

.darkTheme .welcomeBanner {
  background-color: #2d3748;
  color: #f7fafc;
}

.darkTheme .readOnlyNotice {
  color: #e2e8f0;
}
`;
    if (!cssContent.includes('.darkTheme')) {
        fs.writeFileSync(cssPath, cssContent + "\n" + darkRules);
        console.log(`Updated ${name}.module.css`);
    }
  }
});
