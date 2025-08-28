/**
 * Generate Loan Application PDF
 * Test script to generate PDF from application data
 */

const PDFGeneratorService = require('../src/services/pdf-generator');
const fs = require('fs').promises;
const path = require('path');

async function generateLoanApplicationPDF() {
    console.log('🔄 Generating Loan Application PDF');
    console.log('====================================');
    
    const pdfGenerator = new PDFGeneratorService();
    
    // Use the latest application number from our test
    const applicationNumber = 'EL_1756359392860_f97i4u1l4';
    
    try {
        console.log(`📋 Processing application: ${applicationNumber}`);
        
        // Generate PDF
        const result = await pdfGenerator.generatePDFForApplication(applicationNumber);
        
        if (result.success) {
            console.log('✅ PDF Generated Successfully!');
            console.log('📄 File Path:', result.filePath);
            console.log('📊 File Size:', (result.fileSize / 1024).toFixed(2) + ' KB');
            console.log('🔢 Application Number:', result.applicationNumber);
            
            // Also generate a text summary
            const applicationDataPath = path.join(__dirname, `applications/${applicationNumber}/application-data.json`);
            const applicationData = JSON.parse(await fs.readFile(applicationDataPath, 'utf8'));
            
            const textSummary = await pdfGenerator.generateTextSummary(applicationData);
            const summaryPath = path.join(__dirname, `applications/${applicationNumber}/documents/application-summary.txt`);
            await fs.writeFile(summaryPath, textSummary);
            
            console.log('📝 Text Summary Generated:', summaryPath);
            
        } else {
            console.error('❌ PDF Generation Failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error.message);
    }
}

// Run the PDF generation
generateLoanApplicationPDF();
