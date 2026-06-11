const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Parse SQL CREATE TABLE statements
function parseSchema(sqlContent) {
  const tables = {};
  const tableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const tableContent = match[2];
    
    const columns = [];
    const lines = tableContent.split(',').map(line => line.trim());
    
    for (const line of lines) {
      if (!line) continue;
      
      // Skip constraints (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE, INDEX)
      if (line.toUpperCase().includes('PRIMARY KEY') || 
          line.toUpperCase().includes('FOREIGN KEY') ||
          line.toUpperCase().includes('CHECK') ||
          line.toUpperCase().includes('UNIQUE') ||
          line.toUpperCase().includes('INDEX')) {
        continue;
      }
      
      // Parse column definition
      const columnMatch = line.match(/^(\w+)\s+([A-Z\(\)\s]+)(.*)$/i);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const dataType = columnMatch[2].trim();
        const constraints = columnMatch[3].trim();
        
        columns.push({
          name: columnName,
          type: dataType,
          constraints: constraints,
          nullable: !constraints.toUpperCase().includes('NOT NULL'),
          default: constraints.match(/DEFAULT\s+([^\s]+)/i)?.[1] || ''
        });
      }
    }
    
    tables[tableName] = columns;
  }
  
  return tables;
}

// Generate Excel from schema
async function generateSchemaExcel(sqlPath, outputPath) {
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const tables = parseSchema(sqlContent);

  const workbook = new ExcelJS.Workbook();

  // Create summary sheet
  const summarySheet = workbook.addWorksheet('Table Summary');
  summarySheet.columns = [
    { header: 'Table Name', key: 'tableName', width: 30 },
    { header: 'Column Count', key: 'columnCount', width: 15 },
    { header: 'Description', key: 'description', width: 40 },
  ];

  for (const [tableName, columns] of Object.entries(tables)) {
    summarySheet.addRow({ tableName, columnCount: columns.length, description: '' });
  }

  // Create individual sheets for each table
  for (const [tableName, columns] of Object.entries(tables)) {
    const worksheet = workbook.addWorksheet(tableName);
    worksheet.columns = [
      { header: 'Column Name', key: 'name', width: 25 },
      { header: 'Data Type', key: 'type', width: 20 },
      { header: 'Nullable', key: 'nullable', width: 10 },
      { header: 'Default', key: 'default', width: 15 },
      { header: 'Constraints', key: 'constraints', width: 40 },
    ];

    for (const column of columns) {
      worksheet.addRow({
        name: column.name,
        type: column.type,
        nullable: column.nullable ? 'YES' : 'NO',
        default: column.default,
        constraints: column.constraints,
      });
    }
  }

  await workbook.xlsx.writeFile(outputPath);
  console.log(`Schema Excel generated: ${outputPath}`);
  console.log(`Total tables: ${Object.keys(tables).length}`);
}

// CLI interface
const args = process.argv.slice(2);
const sqlPath = args[0] || path.join(__dirname, '../init-database.sql');
const outputPath = args[1] || path.join(__dirname, '../database-schema.xlsx');

if (!fs.existsSync(sqlPath)) {
  console.error(`SQL file not found: ${sqlPath}`);
  process.exit(1);
}

generateSchemaExcel(sqlPath, outputPath).catch(err => {
  console.error('Error generating Excel:', err);
  process.exit(1);
});

console.log('\nUsage:');
console.log('  node schema-to-excel.js [sql-file] [output-xlsx]');
console.log('\nExamples:');
console.log('  node schema-to-excel.js');
console.log('  node schema-to-excel.js ../init-database.sql');
console.log('  node schema-to-excel.js ../init-database.sql my-schema.xlsx');
