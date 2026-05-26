const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Template structure with sheets and their columns
const TEMPLATE = {
  'Users': [
    { header: 'username', description: 'Unique username (required)' },
    { header: 'email', description: 'Email address (required)' },
    { header: 'password', description: 'Plain text password (will be hashed)' },
    { header: 'role', description: 'employee, hr, manager, admin, owner, supervisor, contractor, daily_labourer' },
    { header: 'status', description: 'active, pending, inactive (default: active)' }
  ],
  'Departments': [
    { header: 'name', description: 'Department name (required)' },
    { header: 'description', description: 'Department description' },
    { header: 'budget', description: 'Annual budget (number)' }
  ],
  'Employees': [
    { header: 'firstName', description: 'First name (required)' },
    { header: 'lastName', description: 'Last name (required)' },
    { header: 'email', description: 'Email address (required)' },
    { header: 'phone', description: 'Phone number' },
    { header: 'department', description: 'Department name' },
    { header: 'position', description: 'Job title' },
    { header: 'employeeId', description: 'Employee ID number' },
    { header: 'gender', description: 'Male, Female, Other' },
    { header: 'dateOfBirth', description: 'YYYY-MM-DD format' },
    { header: 'nationalId', description: 'National ID number' },
    { header: 'address', description: 'Physical address' },
    { header: 'city', description: 'City' },
    { header: 'country', description: 'Country' },
    { header: 'maritalStatus', description: 'Single, Married, Divorced, Widowed' },
    { header: 'nationality', description: 'Nationality' },
    { header: 'employmentType', description: 'full-time, part-time, contract, internship' },
    { header: 'hireDate', description: 'YYYY-MM-DD format' },
    { header: 'salary', description: 'Monthly salary (number)' },
    { header: 'emergencyContactName', description: 'Emergency contact name' },
    { header: 'emergencyContactPhone', description: 'Emergency contact phone' },
    { header: 'emergencyContactRelation', description: 'Relationship to emergency contact' }
  ],
  'Leave Types': [
    { header: 'name', description: 'Leave type name (required)' },
    { header: 'description', description: 'Description' },
    { header: 'daysAllowed', description: 'Number of days allowed per year (number)' },
    { header: 'requiresApproval', description: 'true or false (default: true)' }
  ],
  'Jobs': [
    { header: 'title', description: 'Job title (required)' },
    { header: 'description', description: 'Job description' },
    { header: 'department', description: 'Department name' },
    { header: 'location', description: 'Job location' },
    { header: 'employmentType', description: 'full-time, part-time, contract, internship' },
    { header: 'status', description: 'open, closed, draft (default: open)' },
    { header: 'salaryMin', description: 'Minimum salary (number)' },
    { header: 'salaryMax', description: 'Maximum salary (number)' },
    { header: 'requirements', description: 'Job requirements' },
    { header: 'responsibilities', description: 'Job responsibilities' },
    { header: 'benefits', description: 'Job benefits' },
    { header: 'applicationDeadline', description: 'YYYY-MM-DD format' },
    { header: 'careerLevel', description: 'Entry, Mid, Senior, Management, Executive' },
    { header: 'contactPerson', description: 'Contact person name' },
    { header: 'contactPhone', description: 'Contact phone' },
    { header: 'contactEmail', description: 'Contact email' },
    { header: 'workSchedule', description: 'Work schedule' },
    { header: 'requiredLanguages', description: 'Required languages' },
    { header: 'experienceLevel', description: 'Experience level' },
    { header: 'educationRequirements', description: 'Education requirements' }
  ],
  'Training Programs': [
    { header: 'title', description: 'Training title (required)' },
    { header: 'description', description: 'Training description' },
    { header: 'category', description: 'Training category' },
    { header: 'duration', description: 'Duration in hours (number)' },
    { header: 'cost', description: 'Training cost (number)' },
    { header: 'provider', description: 'Training provider' },
    { header: 'startDate', description: 'YYYY-MM-DD format' },
    { header: 'endDate', description: 'YYYY-MM-DD format' }
  ]
};

// Generate Excel template
function generateTemplate(outputPath) {
  const workbook = XLSX.utils.book_new();

  for (const [sheetName, columns] of Object.entries(TEMPLATE)) {
    // Create header row with descriptions
    const headerRow = columns.map(col => `${col.header} (${col.description})`);
    const data = [headerRow];
    
    // Add a few empty rows for data entry
    for (let i = 0; i < 5; i++) {
      data.push(columns.map(() => ''));
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  XLSX.writeFile(workbook, outputPath);
  console.log(`Template generated: ${outputPath}`);
}

// Convert Excel to SQL INSERT statements
function excelToSql(inputPath, outputPath) {
  const workbook = XLSX.readFile(inputPath);
  const sqlStatements = [];

  sqlStatements.push('-- Generated SQL INSERT statements from Excel data');
  sqlStatements.push('-- Generated at: ' + new Date().toISOString());
  sqlStatements.push('');

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      console.log(`Skipping ${sheetName}: no data rows`);
      continue;
    }

    // Parse headers (remove descriptions in parentheses)
    const headers = data[0].map(h => {
      if (typeof h === 'string') {
        return h.replace(/\s*\(.*?\)\s*$/, '').trim();
      }
      return h;
    });

    // Get data rows (skip header)
    const rows = data.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));

    if (rows.length === 0) {
      console.log(`Skipping ${sheetName}: no data after header`);
      continue;
    }

    sqlStatements.push(`-- ${sheetName}`);
    sqlStatements.push(`-- ${rows.length} record(s)`);

    const tableName = sheetName.toLowerCase().replace(/\s+/g, '_');

    for (const row of rows) {
      const columns = [];
      const values = [];

      headers.forEach((header, index) => {
        const value = row[index];
        if (value !== '' && value !== null && value !== undefined) {
          columns.push(header);
          
          // Handle different data types
          if (typeof value === 'number') {
            values.push(value);
          } else if (typeof value === 'boolean') {
            values.push(value ? 'TRUE' : 'FALSE');
          } else {
            // Escape single quotes and wrap in single quotes
            const escaped = String(value).replace(/'/g, "''");
            values.push(`'${escaped}'`);
          }
        }
      });

      if (columns.length > 0) {
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
        sqlStatements.push(sql);
      }
    }

    sqlStatements.push('');
  }

  fs.writeFileSync(outputPath, sqlStatements.join('\n'));
  console.log(`SQL generated: ${outputPath}`);
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

if (command === 'generate') {
  const outputPath = args[1] || path.join(__dirname, '../data-import-template.xlsx');
  generateTemplate(outputPath);
} else if (command === 'convert') {
  const inputPath = args[1];
  const outputPath = args[2] || path.join(__dirname, '../data-import.sql');
  
  if (!inputPath) {
    console.error('Please provide input Excel file path');
    console.log('Usage: node excel-to-sql-generator.js convert <input.xlsx> [output.sql]');
    process.exit(1);
  }
  
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }
  
  excelToSql(inputPath, outputPath);
} else {
  console.log('Usage:');
  console.log('  Generate template: node excel-to-sql-generator.js generate [output.xlsx]');
  console.log('  Convert to SQL:   node excel-to-sql-generator.js convert <input.xlsx> [output.sql]');
  console.log('');
  console.log('Examples:');
  console.log('  node excel-to-sql-generator.js generate');
  console.log('  node excel-to-sql-generator.js generate my-template.xlsx');
  console.log('  node excel-to-sql-generator.js convert data-import-template.xlsx');
  console.log('  node excel-to-sql-generator.js convert filled-data.xlsx import.sql');
}
