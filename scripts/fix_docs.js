const fs = require('fs');
const file = 'backend/routes/documents.js';
let content = fs.readFileSync(file, 'utf8');

const helper = 
const mockDataPath = path.join(__dirname, '../mockData.json');

const getMockData = () => {
  try {
    if (!fs.existsSync(mockDataPath)) {
      fs.writeFileSync(mockDataPath, JSON.stringify({ users: [], departments: [], staff_departments: [], documents: [] }, null, 2));
    }
    const rawData = fs.readFileSync(mockDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Error reading mock data:', err);
    return { users: [], departments: [], staff_departments: [], documents: [] };
  }
};
;

content = content.replace(\"const mockDataPath = path.join(__dirname, '../mockData.json');\", helper.trim());

// Replace the 6 instances
const target =   const rawData = fs.readFileSync(mockDataPath, \"utf8\");\\n  const data = JSON.parse(rawData);;
content = content.split(  const rawData = fs.readFileSync(mockDataPath, \"utf8\");\\n  const data = JSON.parse(rawData);).join(  const data = getMockData(););
// also cover the indented ones
content = content.split(    const rawData = fs.readFileSync(mockDataPath, \"utf8\");\\n    const data = JSON.parse(rawData);).join(    const data = getMockData(););

fs.writeFileSync(file, content);
console.log('done');
