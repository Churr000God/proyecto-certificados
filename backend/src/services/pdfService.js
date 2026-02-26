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
                const doc = new PDFDocument({ layout: 'landscape', size: 'LETTER' });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                // Background or Border (Simple implementation)
                // In a real scenario, we would load the specific image based on theme.
                // For now, let's create a nice border.
                doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#333');
                doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke('#666');

                // Content
                doc.moveDown(4);
                
                // Title
                doc.font('Helvetica-Bold').fontSize(30).text('CERTIFICADO DE DONACIÓN', { align: 'center' });
                doc.moveDown(2);

                // Body
                doc.font('Helvetica').fontSize(16).text('Se otorga el presente reconocimiento a:', { align: 'center' });
                doc.moveDown(1);
                
                const honoreeName = data.certificate.honoree_name || data.certificate.honoreeName || data.donor.full_name || 'Benefactor';
                doc.font('Helvetica-Bold').fontSize(24).text(honoreeName, { align: 'center', color: '#003366' });
                doc.moveDown(1);

                doc.font('Helvetica').fontSize(16).text('Por su generosa contribución a la causa:', { align: 'center', color: 'black' });
                doc.moveDown(0.5);
                
                const causeName = data.donation.cause_name || data.donation.causeName || 'General';
                doc.font('Helvetica-Bold').fontSize(20).text(causeName, { align: 'center', color: '#5f9598' });
                
                if (data.certificate.personal_message || data.certificate.personalMessage) {
                     doc.moveDown(2);
                     doc.font('Helvetica-Oblique').fontSize(14).text(`"${data.certificate.personal_message || data.certificate.personalMessage}"`, { align: 'center', italic: true });
                }

                // Footer
                doc.moveDown(4);
                doc.fontSize(12).text('Juntos construimos un futuro mejor.', { align: 'center' });
                doc.text(new Date().toLocaleDateString(), { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = pdfService;
