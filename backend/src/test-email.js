const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const emailService = require('./services/emailService');
const pdfService = require('./services/pdfService');

async function testFullFlow() {
    console.log('Iniciando prueba completa de envío de correos (Simulación de flujo real)...');

    // Usamos tu correo para ambas pruebas para que puedas verificar ambos
    const targetEmail = 'dhguilleng@hotmail.com'; 

    const mockDonation = {
        amount: 1500.00,
        cause_name: 'Becas para Líderes del Mañana',
        donation_id: 'TEST-TRANSACCION-001'
    };

    const mockDonor = {
        full_name: 'David Guillén (Rol Donante)',
        email: targetEmail
    };

    const mockBilling = {
        legalName: 'Empresa Patrocinadora S.A.',
        taxId: 'XAXX010101000',
        fiscalEmail: targetEmail, // Simulamos que el correo fiscal es el mismo para que lo veas
        postalCode: '64849',
        taxRegime: '601 - General de Ley Personas Morales',
        address: 'Av. Eugenio Garza Sada 2501, Monterrey, NL'
    };

    const mockCertificate = {
        honoree_name: 'Familia Guillén',
        personal_message: 'Con mucho cariño para apoyar la educación.'
    };

    try {
        // --- PASO 1: Enviar Certificado al Donante ---
        console.log(`\n1. Generando y enviando CERTIFICADO a: ${mockDonor.email}`);
        
        const certBuffer = await pdfService.generateCertificate({
            certificate: mockCertificate,
            donor: mockDonor,
            donation: mockDonation
        });
        console.log(`   PDF Certificado generado (${certBuffer.length} bytes).`);

        await emailService.sendEmail({
            toEmail: mockDonor.email,
            toName: mockDonor.full_name,
            subject: 'TEST - Tu Certificado de Donación',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #003366;">Certificado de Donación (Prueba)</h2>
                    <p>Hola <strong>${mockDonor.full_name}</strong>,</p>
                    <p>Este correo simula el que recibe el <strong>DONANTE</strong>.</p>
                    <p>Adjunto encontrarás el certificado en PDF.</p>
                </div>
            `,
            attachments: [{
                content: certBuffer.toString('base64'),
                name: `Certificado_${mockDonation.donation_id}.pdf`
            }]
        });
        console.log('   ✅ Correo de Certificado enviado correctamente.');


        // --- PASO 2: Enviar Factura/Recibo al Contacto Fiscal ---
        console.log(`\n2. Generando y enviando RECIBO FISCAL a: ${mockBilling.fiscalEmail}`);
        
        const invoiceBuffer = await pdfService.generateInvoice({
            billingDetails: mockBilling,
            donation: mockDonation,
            transactionId: mockDonation.donation_id
        });
        console.log(`   PDF Recibo generado (${invoiceBuffer.length} bytes).`);

        await emailService.sendEmail({
            toEmail: mockBilling.fiscalEmail,
            toName: mockBilling.legalName,
            subject: 'TEST - Comprobante Fiscal de Donación',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; background-color: #f9f9f9;">
                    <h2 style="color: #333;">Comprobante Fiscal (Prueba)</h2>
                    <p>Estimado <strong>${mockBilling.legalName}</strong>,</p>
                    <p>Este correo simula el que recibe el <strong>CONTACTO FISCAL</strong>.</p>
                    <p>Adjunto encontrarás el recibo/factura de la donación.</p>
                </div>
            `,
            attachments: [{
                content: invoiceBuffer.toString('base64'),
                name: `Recibo_${mockDonation.donation_id}.pdf`
            }]
        });
        console.log('   ✅ Correo de Recibo Fiscal enviado correctamente.');

        console.log('\n✨ PRUEBA EXITOSA: Se han enviado ambos correos. Por favor verifica tu bandeja de entrada.');

    } catch (error) {
        console.error('\n❌ ERROR DURANTE LA PRUEBA:', error);
    }
}

testFullFlow();
