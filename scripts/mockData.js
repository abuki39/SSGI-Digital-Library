const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "mockData.json");

function initData() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(
        {
          users: [
            {
              id: 1,
              username: "mockadmin",
              email: "admin@ssgi.edu",
              role: "System Administrators",
              role_id: 1,
              department: "Administration",
              status: "active",
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              username: "mocklib",
              email: "librarian@ssgi.edu",
              role: "Librarians",
              role_id: 2,
              department: "Library Services",
              status: "active",
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              username: "mockstaff",
              email: "staff@ssgi.edu",
              role: "Staff Members",
              role_id: 3,
              department: "Finance",
              department_id: "1",
              status: "active",
              created_at: new Date().toISOString(),
            },
            {
              id: 4,
              username: "mocktrainee",
              email: "trainee@ssgi.edu",
              role: "Registered Trainees/Interns",
              role_id: 4,
              department: "IT Security",
              department_id: "1",
              status: "active",
              created_at: new Date().toISOString(),
            },
          ],
          departments: [
            { id: 1, name: "IT Security" },
            { id: 2, name: "Software Engineering" },
          ],
          staff_departments: [
            { id: 1, name: "Finance" },
            { id: 2, name: "HR" },
          ],
          documents: [
            {
              id: 1,
              title: "Employee Handbook 2026",
              serial_number: "HR-2026-001",
              author: "HR Dept",
              category: "HR",
              department: "HR",
              department_id: "2",
              target_role_id: 2,
              status: "approved",
              uploaded_by: 1,
              uploader_email: "admin@ssgi.edu",
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              title: "Library Guidelines",
              serial_number: "LIB-G-01",
              author: "Librarian Head",
              category: "Guidelines",
              status: "approved",
              uploaded_by: 2,
              uploader_email: "librarian@ssgi.edu",
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              title: "Trainee Onboarding Package",
              serial_number: "TR-ONB-01",
              author: "Training Dept",
              category: "Training",
              status: "approved",
              target_role_id: 4,
              uploaded_by: 3,
              uploader_email: "staff@ssgi.edu",
              created_at: new Date().toISOString(),
            },
          ],
        },
        null,
        2,
      ),
    );
  }
}

function readData() {
  initData();
  const raw = fs.readFileSync(dataFile, "utf8");
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };
