const XLSX = require('xlsx');
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
function generateSchemaExcel(sqlPath, outputPath) {
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const tables = parseSchema(sqlContent);
  
  const workbook = XLSX.utils.book_new();
  
  // Create summary sheet
  const summaryData = [
    ['Table Name', 'Column Count', 'Description'],
  ];
  
  for (const [tableName, columns] of Object.entries(tables)) {
    summaryData.push([tableName, columns.length, '']);
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Table Summary');
  
  // Create individual sheets for each table
  for (const [tableName, columns] of Object.entries(tables)) {
    const sheetData = [
      ['Column Name', 'Data Type', 'Nullable', 'Default', 'Constraints'],
    ];
    
    for (const column of columns) {
      sheetData.push([
        column.name,
        column.type,
        column.nullable ? 'YES' : 'NO',
        column.default,
        column.constraints
      ]);
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Column Name
      { wch: 20 }, // Data Type
      { wch: 10 }, // Nullable
      { wch: 15 }, // Default
      { wch: 40 }, // Constraints
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
  }
  
  XLSX.writeFile(workbook, outputPath);
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

generateSchemaExcel(sqlPath, outputPath);

console.log('\nUsage:');
console.log('  node schema-to-excel.js [sql-file] [output-xlsx]');
console.log('\nExamples:');
console.log('  node schema-to-excel.js');
console.log('  node schema-to-excel.js ../init-database.sql');
console.log('  node schema-to-excel.js ../init-database.sql my-schema.xlsx');
