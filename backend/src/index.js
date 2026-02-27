require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { TABLES, donorSchema, billingDetailsSchema, donationsSchema, certificatesSchema } = require('./db/schema');
const emailService = require('./services/emailService');
const pdfService = require('./services/pdfService');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to map object keys based on schema columns
const mapToDb = (data, schemaColumns) => {
    const mapped = {};
    Object.keys(data).forEach(key => {
        if (schemaColumns[key]) {
            mapped[schemaColumns[key]] = data[key];
        }
    });
    return mapped;
};

// --- ROUTES ---

// Basic Route
app.get('/', (req, res) => {
  res.send('API de Certificados funcionando correctamente');
});

// Check Limit Route
app.post('/api/donations/check-limit', async (req, res) => {
    try {
        const { donor, billingDetails, donation } = req.body;

        if (!donor || !donation || !donation.amount) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1).toISOString();
        const donationAmount = parseFloat(donation.amount);

        // 1. Find potential donor_ids associated with Email, Phone, or RFC
        let donorIds = [];

        // Search by Email or Phone or Fiscal Email
        const emailsToCheck = new Set();
        if (donor.email) emailsToCheck.add(donor.email);
        if (billingDetails && billingDetails.fiscalEmail) emailsToCheck.add(billingDetails.fiscalEmail);

        const orConditions = [];
        if (emailsToCheck.size > 0) {
            emailsToCheck.forEach(email => {
                orConditions.push(`email.eq.${email}`);
            });
        }
        if (donor.phoneNumber) orConditions.push(`phone_number.eq.${donor.phoneNumber}`);
        
        if (orConditions.length > 0) {
            const { data, error } = await supabase
                .from(TABLES.DONOR)
                .select('donor_id')
                .or(orConditions.join(','));
            
            if (!error && data) {
                donorIds.push(...data.map(d => d.donor_id));
            }
        }

        // Search by RFC
        if (billingDetails && billingDetails.taxId) {
            const { data, error } = await supabase
                .from(TABLES.BILLING_DETAILS)
                .select('donor_id')
                .eq('tax_id', billingDetails.taxId);
            
            if (!error && data) {
                donorIds.push(...data.map(d => d.donor_id));
            }
        }

        // Remove duplicates
        const uniqueDonorIds = [...new Set(donorIds)];

        let totalPrevious = 0;

        if (uniqueDonorIds.length > 0) {
            const { data: prevDonations, error } = await supabase
                .from(TABLES.DONATIONS)
                .select('amount')
                .in('donor_id', uniqueDonorIds)
                .gte('created_at', startOfYear);
            
            if (!error && prevDonations) {
                totalPrevious = prevDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            }
        }

        const newTotal = totalPrevious + donationAmount;

        if (newTotal > 250000) {
            return res.status(400).json({
                success: false,
                message: `La donación excede el límite anual de $250,000 MXN. Acumulado actual: $${totalPrevious}`
            });
        }

        res.json({ success: true, message: 'Límite validado correctamente' });

    } catch (error) {
        console.error('Error validando límite:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Process Donation Route
app.post('/api/donations/process', async (req, res) => {
    try {
        const { donor, billingDetails, donation, certificate, beneficiaryData, certificatePdfBase64 } = req.body;
        console.log('Incoming certificatePdfBase64:', certificatePdfBase64 ? `present (${String(certificatePdfBase64).length} chars)` : 'missing');

        // 1. Validar datos mínimos
        if (!donor || !donation || !donation.amount) {
            return res.status(400).json({ success: false, message: 'Datos incompletos' });
        }

        // Note: We re-validate limit here implicitly or we could skip it if we trust the previous check.
        // Ideally, we should check again to prevent race conditions, but for now we proceed.

        // 2. Insert Donor
        const donorData = mapToDb(donor, donorSchema.columns);
        // Ensure created_at is set if not provided (though frontend sends it)
        if (!donorData.created_at) donorData.created_at = new Date().toISOString();

        const { data: savedDonor, error: donorError } = await supabase
            .from(TABLES.DONOR)
            .insert(donorData)
            .select()
            .single();

        if (donorError) throw new Error(`Error saving donor: ${donorError.message}`);
        const donorId = savedDonor.donor_id;

        // 3. Insert Billing Details (if provided)
        if (billingDetails) {
            const billingData = mapToDb(billingDetails, billingDetailsSchema.columns);
            billingData.donor_id = donorId;
            if (!billingData.created_at) billingData.created_at = new Date().toISOString();

            const { error: billingError } = await supabase
                .from(TABLES.BILLING_DETAILS)
                .insert(billingData);
            
            if (billingError) throw new Error(`Error saving billing details: ${billingError.message}`);
        }

        // 4. Insert Donation
        const donationData = mapToDb(donation, donationsSchema.columns);
        donationData.donor_id = donorId;
        donationData.payment_status = 'succeeded';
        donationData.paid_at = new Date().toISOString();
        if (!donationData.created_at) donationData.created_at = new Date().toISOString();

        // --- Handle Beneficiary Creation if data provided ---
        if (beneficiaryData && beneficiaryData.data) {
            const bData = beneficiaryData.data;
            const bType = beneficiaryData.type; 

            // Fetch Brand ID if needed
            let brandId = null;
            if (donationData.cause_id) {
                const { data: cause } = await supabase
                    .from(TABLES.CAUSES)
                    .select('brand_id')
                    .eq('cause_id', donationData.cause_id)
                    .single();
                if (cause) brandId = cause.brand_id;
            }

            try {
                if (bType === 'student_internal') {
                    const { data: newBen, error: benError } = await supabase
                        .from(TABLES.STUDENT_BENEFICIARIES)
                        .insert({
                            student_name: bData.studentName,
                            student_id: bData.studentId,
                            campus: bData.campus,
                            brand_id: brandId,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (benError) throw benError;
                    donationData.student_beneficiary_id = newBen.student_beneficiary_id;
                    donationData.target_type = 'student_internal';
                } else if (bType === 'student_external') {
                    const { data: newBen, error: benError } = await supabase
                        .from(TABLES.EXTERNAL_PERSONS)
                        .insert({
                            full_name: bData.fullName,
                            email: bData.email,
                            phone_number: bData.phoneNumber,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (benError) throw benError;
                    donationData.external_person_id = newBen.external_person_id;
                    donationData.target_type = 'student_external';
                } else if (bType === 'group') {
                    const { data: newBen, error: benError } = await supabase
                        .from(TABLES.REPRESENTATIVE_GROUPS)
                        .insert({
                            name: bData.name,
                            category: bData.category,
                            campus: bData.campus,
                            brand_id: brandId,
                            cause_id: donationData.cause_id,
                            is_active: true,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (benError) throw benError;
                    donationData.representative_group_id = newBen.group_id;
                    donationData.target_type = 'group';
                } else if (bType === 'facility') {
                    const { data: newBen, error: benError } = await supabase
                        .from(TABLES.FACILITIES)
                        .insert({
                            name: bData.name,
                            campus: bData.campus,
                            brand_id: brandId,
                            cause_id: donationData.cause_id,
                            is_active: true,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (benError) throw benError;
                    donationData.facility_id = newBen.facility_id;
                    donationData.target_type = 'facility';
                } else if (bType === 'program') {
                    const { data: newBen, error: benError } = await supabase
                        .from(TABLES.SOCIAL_PROGRAMS)
                        .insert({
                            name: bData.name,
                            brand_id: brandId,
                            cause_id: donationData.cause_id,
                            is_active: true,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                    if (benError) throw benError;
                    donationData.social_program_id = newBen.program_id;
                    donationData.target_type = 'program';
                }
            } catch (benErr) {
                console.warn('Error creating beneficiary, proceeding with general donation:', benErr.message);
                donationData.target_type = 'general';
            }
        }

        // Validar target_type con el ENUM
        const validTargetTypes = ['general', 'student_internal', 'student_external', 'group', 'facility', 'program'];
        
        console.log('Target Type recibido:', donationData.target_type);
        console.log('Representative Group ID recibido:', donationData.representative_group_id);

        if (!validTargetTypes.includes(donationData.target_type)) {
            console.warn(`Invalid target_type received: ${donationData.target_type}. Defaulting to 'general'.`);
            donationData.target_type = 'general';
        }
        
        // CORRECCIÓN BASADA EN CHECK CONSTRAINT DE LA BASE DE DATOS:
        if (donationData.target_type === 'group' && !donationData.representative_group_id) {
             console.warn("Target type is 'group' but representative_group_id is missing. Defaulting to 'general' to avoid DB constraint violation.");
             donationData.target_type = 'general';
        }
        if (donationData.target_type === 'student_internal' && !donationData.student_beneficiary_id) donationData.target_type = 'general';
        if (donationData.target_type === 'student_external' && !donationData.external_person_id) donationData.target_type = 'general';
        if (donationData.target_type === 'facility' && !donationData.facility_id) donationData.target_type = 'general';
        if (donationData.target_type === 'program' && !donationData.social_program_id) donationData.target_type = 'general';

        const { data: savedDonation, error: donationError } = await supabase
            .from(TABLES.DONATIONS)
            .insert(donationData)
            .select()
            .single();

        if (donationError) throw new Error(`Error saving donation: ${donationError.message}`);
        const donationId = savedDonation.donation_id;

        // 5. Insert Certificate
        if (certificate) {
            const certificateData = mapToDb(certificate, certificatesSchema.columns);
            certificateData.donation_id = donationId;
            if (!certificateData.created_at) certificateData.created_at = new Date().toISOString();

            const { error: certError } = await supabase
                .from(TABLES.CERTIFICATES)
                .insert(certificateData);

            if (certError) throw new Error(`Error saving certificate: ${certError.message}`);
        }

        console.log('Transacción exitosa:', donationId);

        // --- EMAIL NOTIFICATIONS (Async - do not block response) ---
        (async () => {
            try {
                // 1. Send Certificate Email to Donor
                if (donorData.email) {
                    let certificateBuffer;

                    // Use client-generated PDF if available (exact match), otherwise fallback to backend generation
                    if (certificatePdfBase64) {
                        try {
                            const cleanedBase64 = String(certificatePdfBase64).replace(/^data:application\/pdf;base64,/, '');
                            const decodedBuffer = Buffer.from(cleanedBase64, 'base64');
                            const pdfSignature = decodedBuffer.subarray(0, 4).toString('ascii');
                            if (pdfSignature !== '%PDF') {
                                throw new Error('Client PDF is not a valid PDF binary (missing %PDF signature).');
                            }
                            certificateBuffer = decodedBuffer;
                            console.log(`Using client-generated PDF for email attachment (${certificateBuffer.length} bytes).`);
                        } catch (e) {
                            console.error('Error decoding client PDF, falling back to server generation:', e);
                        }
                    }
                    
                    if (!certificateBuffer) {
                        certificateBuffer = await pdfService.generateCertificate({
                            certificate: certificate || {},
                            donor: donorData,
                            donation: donationData
                        });
                        console.log('Generated server-side PDF for email attachment.');
                    }

                    await emailService.sendEmail({
                        toEmail: donorData.email,
                        toName: donorData.full_name,
                        subject: 'Tu Certificado de Generosidad - Becas con Propósito',
                        htmlContent: `
                            <div style="font-family: Arial, sans-serif; color: #333;">
                                <h1 style="color: #003366;">¡Gracias por tu generosidad!</h1>
                                <p>Estimado/a <strong>${donorData.full_name}</strong>,</p>
                                <p>Agradecemos profundamente tu contribución a la causa <strong>${donationData.cause_name || 'Becas con Propósito'}</strong>.</p>
                                <p>Adjunto encontrarás tu certificado de donación con el diseño personalizado que seleccionaste.</p>
                                <br>
                                <p>Atentamente,</p>
                                <p>El equipo de Becas con Propósito</p>
                            </div>
                        `,
                        attachments: [{
                            content: certificateBuffer.toString('base64'),
                            name: `Certificado_${donationId}.pdf`,
                            contentType: 'application/pdf'
                        }]
                    });
                }

                // 2. Send Invoice Email to Fiscal Contact (if applicable)
                if (billingDetails && billingDetails.fiscalEmail) {
                    const invoiceBuffer = await pdfService.generateInvoice({
                        billingDetails,
                        donation: donationData,
                        transactionId: donationId
                    });

                    await emailService.sendEmail({
                        toEmail: billingDetails.fiscalEmail,
                        toName: billingDetails.legalName || 'Departamento Fiscal',
                        subject: 'Comprobante de Donación - Proyecto Certificados',
                        htmlContent: `
                            <h1>Comprobante de Transacción</h1>
                            <p>Adjunto encontrará el recibo correspondiente a la donación con ID: ${donationId}.</p>
                            <p>Monto: $${donationData.amount}</p>
                            <br>
                            <p>Atentamente,</p>
                            <p>El equipo de Proyecto Certificados</p>
                        `,
                        attachments: [{
                            content: invoiceBuffer.toString('base64'),
                            name: `Recibo_${donationId}.pdf`
                        }]
                    });
                }
            } catch (emailError) {
                console.error('Error sending notification emails:', emailError);
            }
        })();

        // 6. Responder Éxito
        res.json({
            success: true,
            message: 'Donación procesada correctamente',
            transactionId: donationId,
            certificateUrl: `/api/certificates/download/${donationId}` // URL simulada por ahora
        });

    } catch (error) {
        console.error('Error procesando donación:', error);
        res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
});

// Process Bulk Donation Route
app.post('/api/donations/process-bulk', async (req, res) => {
    try {
        const { donor, billingDetails, donations, totalAmount } = req.body;

        if (!donor || !donations || !Array.isArray(donations) || donations.length === 0) {
            return res.status(400).json({ success: false, message: 'Datos incompletos o inválidos para carga masiva' });
        }

        console.log(`Procesando carga masiva de ${donations.length} donaciones. Total: ${totalAmount}`);

        // 1. Insert Donor (Once)
        const donorData = mapToDb(donor, donorSchema.columns);
        if (!donorData.created_at) donorData.created_at = new Date().toISOString();

        const { data: savedDonor, error: donorError } = await supabase
            .from(TABLES.DONOR)
            .insert(donorData)
            .select()
            .single();

        if (donorError) throw new Error(`Error saving donor: ${donorError.message}`);
        const donorId = savedDonor.donor_id;

        // 2. Insert Billing Details (Once, if provided)
        if (billingDetails) {
            const billingData = mapToDb(billingDetails, billingDetailsSchema.columns);
            billingData.donor_id = donorId;
            if (!billingData.created_at) billingData.created_at = new Date().toISOString();

            const { error: billingError } = await supabase
                .from(TABLES.BILLING_DETAILS)
                .insert(billingData);
            
            if (billingError) throw new Error(`Error saving billing details: ${billingError.message}`);
        }

        // 3. Process each donation
        // Note: For better performance, we should use bulk insert, but we need donation_id for certificates.
        // So we will loop or use Promise.all. Promise.all is faster but harder to rollback.
        
        const results = [];
        const errors = [];

        // Helper to normalize target_type
        const normalizeTargetType = (dData) => {
             const validTargetTypes = ['general', 'student_internal', 'student_external', 'group', 'facility', 'program'];
             if (!validTargetTypes.includes(dData.target_type)) return 'general';
             if (dData.target_type === 'group' && !dData.representative_group_id) return 'general';
             if (dData.target_type === 'student_internal' && !dData.student_beneficiary_id) return 'general';
             if (dData.target_type === 'student_external' && !dData.external_person_id) return 'general';
             if (dData.target_type === 'facility' && !dData.facility_id) return 'general';
             if (dData.target_type === 'program' && !dData.social_program_id) return 'general';
             return dData.target_type;
        };

        for (const item of donations) {
            try {
                // Insert Donation
                const donationData = mapToDb(item.donation, donationsSchema.columns);
                donationData.donor_id = donorId;
                donationData.payment_status = 'succeeded';
                donationData.paid_at = new Date().toISOString();
                if (!donationData.created_at) donationData.created_at = new Date().toISOString();
                
                donationData.target_type = normalizeTargetType(donationData);

                const { data: savedDonation, error: donationError } = await supabase
                    .from(TABLES.DONATIONS)
                    .insert(donationData)
                    .select()
                    .single();

                if (donationError) throw new Error(donationError.message);
                
                const donationId = savedDonation.donation_id;

                // Insert Certificate
                if (item.certificate) {
                    const certificateData = mapToDb(item.certificate, certificatesSchema.columns);
                    certificateData.donation_id = donationId;
                    if (!certificateData.created_at) certificateData.created_at = new Date().toISOString();

                    const { error: certError } = await supabase
                        .from(TABLES.CERTIFICATES)
                        .insert(certificateData);
                    
                    if (certError) console.warn(`Error saving certificate for donation ${donationId}:`, certError);
                }
                
                results.push(donationId);

            } catch (err) {
                console.error('Error processing item in bulk:', err);
                errors.push(err.message);
            }
        }

        if (results.length === 0 && errors.length > 0) {
            throw new Error(`Fallo total en carga masiva: ${errors[0]}`);
        }

        res.json({
            success: true,
            message: `Procesadas ${results.length} de ${donations.length} donaciones.`,
            transactionId: results[0], // Return first ID as reference
            count: results.length,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        console.error('Error procesando carga masiva:', error);
        res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
});

// Import routes (placeholder for future implementation)
// const certificateRoutes = require('./routes/certificates');
// app.use('/api/certificates', certificateRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
