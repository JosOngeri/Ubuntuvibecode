const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate interview checklist PDF for panelists
 * @param {Object} application - Job application data
 * @param {Object} job - Job data
 * @param {Array} metrics - Custom scoring metrics
 * @param {String} outputPath - Where to save the PDF
 * @returns {Promise<String>} - Path to generated PDF
 */
async function generateInterviewChecklist(application, job, metrics, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('PDF Generator - Metrics received:', metrics);
      console.log('PDF Generator - Metrics type:', typeof metrics);
      console.log('PDF Generator - Metrics length:', metrics?.length);
      // Create a document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      
      doc.pipe(stream);
      
      // Add fonts (if needed)
      doc.font('Helvetica');
      
      // Header
      doc.fontSize(20).text('Interview Evaluation Checklist', { align: 'center' });
      doc.moveDown();
      
      // Job and Applicant Info
      doc.fontSize(14).text(`Job Title: ${job.title}`, { continued: false });
      doc.text(`Department: ${job.department}`, { continued: false });
      doc.text(`Applicant: ${application.applicantName || 'Unknown'}`, { continued: false });
      doc.text(`Email: ${application.applicantEmail || 'N/A'}`, { continued: false });
      doc.text(`Phone: ${application.applicantPhone || 'N/A'}`, { continued: false });
      doc.moveDown();
      
      // Panelist Information
      doc.fontSize(16).text('Panelist Information:', { underline: true });
      doc.fontSize(12);
      doc.text('Name: _________________________');
      doc.text('Email: _________________________');
      doc.text('Date: _________________________');
      doc.moveDown();
      
      // Use custom metrics or defaults if none provided
      doc.fontSize(16).text('Scoring Criteria:', { underline: true });
      doc.fontSize(12);
      
      // Use only the custom metrics provided, or fall back to defaults
      const allMetrics = metrics && metrics.length > 0 
        ? metrics 
        : [
            { name: 'Technical Skills', maxScore: 25 },
            { name: 'Communication Skills', maxScore: 20 },
            { name: 'Problem Solving', maxScore: 20 },
            { name: 'Team Fit', maxScore: 15 },
            { name: 'Experience', maxScore: 20 }
          ];
      
      // Create scoring table
      let yPosition = doc.y;
      const tableTop = yPosition;
      const colWidths = [200, 80, 80, 150];
      
      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Criteria', 50, yPosition, { width: colWidths[0] });
      doc.text('Max Score', 250, yPosition, { width: colWidths[1] });
      doc.text('Score', 330, yPosition, { width: colWidths[2] });
      doc.text('Comments', 410, yPosition, { width: colWidths[3] });
      
      yPosition += 20;
      
      // Table rows
      doc.font('Helvetica');
      allMetrics.forEach((metric, index) => {
        doc.text(metric.name, 50, yPosition, { width: colWidths[0] });
        doc.text(metric.maxScore.toString(), 250, yPosition, { width: colWidths[1] });
        doc.text('___', 330, yPosition, { width: colWidths[2] });
        doc.text('_________________________', 410, yPosition, { width: colWidths[3] });
        yPosition += 25;
      });
      
      // Total score row
      yPosition += 10;
      doc.font('Helvetica-Bold');
      doc.text('TOTAL SCORE:', 50, yPosition, { width: colWidths[0] });
      doc.text(`___ / ${allMetrics.reduce((sum, m) => sum + m.maxScore, 0)}`, 330, yPosition, { width: colWidths[2] });
      
      doc.moveDown(2);
      
      // Overall Recommendation
      doc.fontSize(16).text('Overall Recommendation:', { underline: true });
      doc.fontSize(12);
      doc.text('☐ Strongly Recommend');
      doc.text('☐ Recommend');
      doc.text('☐ Neutral');
      doc.text('☐ Do Not Recommend');
      doc.moveDown();
      
      // Additional Comments
      doc.fontSize(16).text('Additional Comments:', { underline: true });
      doc.fontSize(12);
      doc.moveDown(0.5);
      
      // Create a proper comment box with lines
      const commentBoxTop = doc.y;
      const commentBoxLeft = 50;
      const commentBoxWidth = 500;
      const lineHeight = 20;
      const numberOfLines = 6;
      
      // Draw comment box border
      doc.rect(commentBoxLeft, commentBoxTop, commentBoxWidth, numberOfLines * lineHeight);
      
      // Draw horizontal lines for writing
      for (let i = 1; i < numberOfLines; i++) {
        doc.moveTo(commentBoxLeft, commentBoxTop + (i * lineHeight))
           .lineTo(commentBoxLeft + commentBoxWidth, commentBoxTop + (i * lineHeight))
           .stroke();
      }
      
      doc.y = commentBoxTop + (numberOfLines * lineHeight) + 20;
      
      // Signature
      doc.fontSize(12);
      doc.text('Panelist Signature: _________________________');
      doc.text('Date: _________________________');
      
      // Footer
      doc.fontSize(8).text(
        `Generated on ${new Date().toLocaleDateString()} | Ubuntu HRMS`,
        { align: 'center' }
      );
      
      // Finalize the PDF and end the stream
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInterviewChecklist
};
