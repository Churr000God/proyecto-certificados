const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const pdfService = {
    /**
     * Generates a simple PDF Invoice
     * @param {Object} data - { billingDetails, donation, transactionId }
     * @returns {Promise<Buffer>}
     */
    generateInvoice: (data) => {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Header
                doc.fontSize(20).text('Recibo de Donación', { align: 'center' });
                doc.moveDown();
                
                // Transaction Info
                doc.fontSize(12).text(`ID Transacción: ${data.transactionId}`);
                doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
                doc.moveDown();

                // Billing Details
                if (data.billingDetails) {
                    doc.fontSize(14).text('Datos Fiscales:', { underline: true });
                    doc.fontSize(12);
                    doc.text(`Nombre/Razón Social: ${data.billingDetails.legal_name || data.billingDetails.legalName}`);
                    doc.text(`RFC: ${data.billingDetails.tax_id || data.billingDetails.taxId}`);
                    doc.text(`Régimen Fiscal: ${data.billingDetails.tax_regime || data.billingDetails.taxRegime || '601'}`);
                    doc.text(`CP: ${data.billingDetails.postal_code || data.billingDetails.postalCode}`);
                    doc.text(`Dirección: ${data.billingDetails.address || ''}`);
                    doc.moveDown();
                }

                // Donation Details
                doc.fontSize(14).text('Detalles de la Donación:', { underline: true });
                doc.fontSize(12);
                doc.text(`Monto: ${formatCurrency(data.donation.amount)}`);
                doc.text(`Causa: ${data.donation.cause_name || data.donation.causeName || 'General'}`);
                
                doc.moveDown();
                doc.text('Gracias por su generosidad.', { align: 'center', italic: true });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Generates a Certificate PDF
     * @param {Object} data - { certificate, donor, donation }
     * @returns {Promise<Buffer>}
     */
    generateCertificate: (data) => {
        return new Promise((resolve, reject) => {
            try {
                // Layout landscape
                const doc = new PDFDocument({ layout: 'landscape', size: 'LETTER', margin: 0 });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // --- THEME LOGIC ---
                const causeName = data.donation.cause_name || data.donation.causeName || 'General';
                const lowerCause = causeName.toLowerCase();
                
                // Default Theme (Blue/Neutral)
                let theme = {
                    primaryColor: '#2c3e50',
                    secondaryColor: '#34495e',
                    accentColor: '#bdc3c7',
                    fontTitle: 'Helvetica-Bold',
                    fontBody: 'Helvetica',
                    logo: 'logo.png',
                    borderStyle: 'simple'
                };

                // Determine Theme based on Cause Name
                if (lowerCause.includes('beca')) {
                    theme = {
                        primaryColor: '#1a365d', // Navy
                        secondaryColor: '#c05621', // Gold/Orange accent
                        accentColor: '#2c5282',
                        fontTitle: 'Times-Bold',
                        fontBody: 'Times-Roman',
                        logo: 'Becas.png',
                        borderStyle: 'double'
                    };
                } else if (lowerCause.includes('salud') || lowerCause.includes('medicina') || lowerCause.includes('cirugia') || lowerCause.includes('consulta')) {
                    theme = {
                        primaryColor: '#c53030', // Red
                        secondaryColor: '#fc8181',
                        accentColor: '#9b2c2c',
                        fontTitle: 'Helvetica-Bold',
                        fontBody: 'Helvetica',
                        logo: 'ApoyoParaMedicinas.png',
                        borderStyle: 'dashed'
                    };
                } else if (lowerCause.includes('equipo') || lowerCause.includes('deporte') || lowerCause.includes('representativo')) {
                    theme = {
                        primaryColor: '#dd6b20', // Orange
                        secondaryColor: '#fbd38d', // Light Orange
                        accentColor: '#c05621',
                        fontTitle: 'Helvetica-Bold', // Impact-like
                        fontBody: 'Helvetica',
                        logo: 'EquipoRepresentativos.png',
                        borderStyle: 'zigzag'
                    };
                } else if (lowerCause.includes('infraestructura') || lowerCause.includes('instalacion') || lowerCause.includes('construccion')) {
                     theme = {
                        primaryColor: '#276749', // Green
                        secondaryColor: '#9ae6b4',
                        accentColor: '#22543d',
                        fontTitle: 'Courier-Bold',
                        fontBody: 'Courier',
                        logo: 'MejoraInstalaciones.png',
                        borderStyle: 'solid-dashed'
                    };
                } else if (lowerCause.includes('program') || lowerCause.includes('social') || lowerCause.includes('comunidad')) {
                    theme = {
                        primaryColor: '#6b46c1', // Purple
                        secondaryColor: '#d6bcfa',
                        accentColor: '#805ad5',
                        fontTitle: 'Times-BoldItalic',
                        fontBody: 'Times-Roman',
                        logo: 'ProgramasSociales.png',
                        borderStyle: 'rounded'
                    };
                }

                // Resolve logo path
                // Images are in /app/assets/img/ (mapped from frontend/assets)
                // We use __dirname (src/services) so we go up 2 levels
                const logoPath = path.join(__dirname, '../../assets/img', theme.logo);
                // Fallback to default logo if specific one doesn't exist, or try assets root
                let finalLogoPath = logoPath;
                if (!fs.existsSync(finalLogoPath)) {
                     // Try looking in assets root
                     const rootAssetPath = path.join(__dirname, '../../assets', theme.logo);
                     if (fs.existsSync(rootAssetPath)) {
                         finalLogoPath = rootAssetPath;
                     } else {
                         // Default logo
                         finalLogoPath = path.join(__dirname, '../../assets/logo.png');
                     }
                }

                // --- DRAWING ---
                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;
                const centerX = pageWidth / 2;

                // 1. Background / Border
                if (theme.borderStyle === 'zigzag') {
                     // Orange Theme
                     doc.rect(0, 0, pageWidth, pageHeight).fill('#fff'); // White bg
                     
                     // Outer thick border (Light Orange)
                     doc.lineWidth(20)
                        .rect(10, 10, pageWidth - 20, pageHeight - 20)
                        .stroke(theme.secondaryColor);
                     
                     // Inner thin border (Dark Orange)
                     doc.lineWidth(4)
                        .rect(30, 30, pageWidth - 60, pageHeight - 60)
                        .stroke(theme.primaryColor);

                } else if (theme.borderStyle === 'double') {
                     // Becas Theme
                     doc.rect(0, 0, pageWidth, pageHeight).fill('#fff');
                     doc.lineWidth(8)
                        .rect(20, 20, pageWidth - 40, pageHeight - 40)
                        .stroke(theme.primaryColor);
                     doc.lineWidth(2)
                        .rect(32, 32, pageWidth - 64, pageHeight - 64)
                        .stroke(theme.secondaryColor);

                } else if (theme.borderStyle === 'dashed') {
                     // Salud Theme
                     doc.rect(0, 0, pageWidth, pageHeight).fill('#fff5f5');
                     doc.lineWidth(6)
                        .dash(10, space=5)
                        .rect(20, 20, pageWidth - 40, pageHeight - 40)
                        .stroke(theme.primaryColor);
                     doc.undash();

                } else if (theme.borderStyle === 'solid-dashed') {
                    // Infraestructura Theme
                    doc.rect(0, 0, pageWidth, pageHeight).fill('#f0fff4');
                    doc.lineWidth(4)
                       .rect(20, 20, pageWidth - 40, pageHeight - 40)
                       .stroke(theme.primaryColor);
                    doc.lineWidth(2)
                       .dash(5, space=5)
                       .rect(30, 30, pageWidth - 60, pageHeight - 60)
                       .stroke(theme.secondaryColor);
                    doc.undash();

                } else {
                    // Default / Program
                    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.borderStyle === 'rounded' ? '#faf5ff' : '#fff');
                    doc.lineWidth(10)
                       .rect(20, 20, pageWidth - 40, pageHeight - 40)
                       .stroke(theme.secondaryColor);
                    doc.lineWidth(1)
                       .rect(30, 30, pageWidth - 60, pageHeight - 60)
                       .stroke(theme.primaryColor);
                }

                // 2. Logo Area
                // Center the logo at the top
                if (fs.existsSync(finalLogoPath)) {
                    try {
                        doc.image(finalLogoPath, centerX - 50, 60, { width: 100, height: 100, align: 'center', valign: 'center', fit: [100, 100] });
                    } catch (err) {
                        console.error('Error loading logo:', err);
                    }
                }

                // Move down below logo
                let currentY = 180;

                // 3. Title: "CERTIFICADO DE GENEROSIDAD"
                doc.font(theme.fontTitle)
                   .fontSize(36)
                   .fillColor(theme.primaryColor)
                   .text('CERTIFICADO DE GENEROSIDAD', 0, currentY, { align: 'center', width: pageWidth });
                
                currentY += 50;

                // 4. Subtitle: "Este certificado reconoce que"
                doc.font(theme.fontBody)
                   .fontSize(16)
                   .fillColor('#718096') // Gray
                   .text('Este certificado reconoce que', 0, currentY, { align: 'center', width: pageWidth });
                
                currentY += 40;

                // 5. Recipient Name
                const honoreeName = data.certificate.honoree_name || data.certificate.honoreeName || data.donor.full_name || 'Benefactor';
                doc.font(theme.fontTitle)
                   .fontSize(32)
                   .fillColor(theme.primaryColor)
                   .text(honoreeName, 0, currentY, { align: 'center', width: pageWidth });
                
                // Draw underline for name
                const nameWidth = doc.widthOfString(honoreeName);
                const lineStart = (pageWidth - nameWidth) / 2 - 20;
                const lineEnd = (pageWidth + nameWidth) / 2 + 20;
                const lineY = currentY + 35; // Below text
                
                doc.lineWidth(2)
                   .moveTo(lineStart, lineY)
                   .lineTo(lineEnd, lineY)
                   .stroke(theme.secondaryColor);

                currentY += 60;

                // 6. Body Text: "Ha realizado una valiosa donación..."
                doc.font(theme.fontBody)
                   .fontSize(16)
                   .fillColor('#4a5568')
                   .text('Ha realizado una valiosa donación para apoyar las', 0, currentY, { align: 'center', width: pageWidth, continued: true });
                
                doc.font(theme.fontTitle)
                   .fillColor(theme.primaryColor)
                   .text(` ${causeName}`, { continued: false });

                // 7. Personal Message (Optional)
                if (data.certificate.personal_message || data.certificate.personalMessage) {
                     currentY += 40;
                     doc.font(theme.fontBody) // Italic if available
                        .fontSize(14)
                        .fillColor('#555')
                        .text(`"${data.certificate.personal_message || data.certificate.personalMessage}"`, 0, currentY, { align: 'center', italic: true, width: pageWidth });
                }

                // 8. Footer
                // Stick to bottom
                const footerY = pageHeight - 80;
                
                doc.fontSize(12)
                   .fillColor('#888')
                   .text('Juntos construimos un futuro mejor.', 0, footerY, { align: 'center', width: pageWidth });
                doc.text(new Date().toLocaleDateString(), 0, footerY + 20, { align: 'center', width: pageWidth });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = pdfService;
