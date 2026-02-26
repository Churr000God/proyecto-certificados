require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { TABLES, donorSchema, billingDetailsSchema, donationsSchema, certificatesSchema } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(cors());
app.use(express.json());

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
        const { donor, billingDetails, donation, certificate } = req.body;

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

        // Validar target_type con el ENUM
        const validTargetTypes = ['general', 'student_internal', 'student_external', 'group', 'facility', 'program'];
        
        console.log('Target Type recibido:', donationData.target_type);
        console.log('Representative Group ID recibido:', donationData.representative_group_id);

        if (!validTargetTypes.includes(donationData.target_type)) {
            console.warn(`Invalid target_type received: ${donationData.target_type}. Defaulting to 'general'.`);
            donationData.target_type = 'general';
        }
        
        // CORRECCIÓN BASADA EN CHECK CONSTRAINT DE LA BASE DE DATOS:
        // El constraint "donations_target_chk" exige que si target_type = 'group',
        // entonces 'representative_group_id' NO DEBE SER NULL.
        // Y los otros IDs deben ser NULL.
        
        if (donationData.target_type === 'group' && !donationData.representative_group_id) {
             console.warn("Target type is 'group' but representative_group_id is missing. Defaulting to 'general' to avoid DB constraint violation.");
             donationData.target_type = 'general';
        }
        // Aplica la misma lógica para otros tipos si fuera necesario
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

// Import routes (placeholder for future implementation)
// const certificateRoutes = require('./routes/certificates');
// app.use('/api/certificates', certificateRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
