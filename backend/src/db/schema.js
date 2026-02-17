const TABLES = {
  BRANDS: 'brands',
  CAUSES: 'causes',
  REPRESENTATIVE_GROUPS: 'representative_groups',
  FACILITIES: 'facilities',
  SOCIAL_PROGRAMS: 'social_programs',
  STUDENT_BENEFICIARIES: 'student_beneficiaries',
  EXTERNAL_PERSONS: 'external_persons',
  DONOR: 'donor',
  BILLING_DETAILS: 'billing_details',
  DONATIONS: 'donations',
  CERTIFICATES: 'certificates'
};

const brandsSchema = {
  table: TABLES.BRANDS,
  columns: {
    brandId: 'brand_id',
    name: 'name',
    slug: 'slug',
    primaryColor: 'primary_color',
    logoUrl: 'logo_url',
    createdAt: 'created_at'
  }
};

const causesSchema = {
  table: TABLES.CAUSES,
  columns: {
    causeId: 'cause_id',
    brandId: 'brand_id',
    name: 'name',
    description: 'description',
    createdAt: 'created_at'
  }
};

const representativeGroupsSchema = {
  table: TABLES.REPRESENTATIVE_GROUPS,
  columns: {
    groupId: 'group_id',
    brandId: 'brand_id',
    causeId: 'cause_id',
    name: 'name',
    category: 'category',
    campus: 'campus',
    isActive: 'is_active',
    createdAt: 'created_at'
  }
};

const facilitiesSchema = {
  table: TABLES.FACILITIES,
  columns: {
    facilityId: 'facility_id',
    brandId: 'brand_id',
    causeId: 'cause_id',
    name: 'name',
    campus: 'campus',
    isActive: 'is_active',
    createdAt: 'created_at'
  }
};

const socialProgramsSchema = {
  table: TABLES.SOCIAL_PROGRAMS,
  columns: {
    programId: 'program_id',
    brandId: 'brand_id',
    causeId: 'cause_id',
    name: 'name',
    description: 'description',
    isActive: 'is_active',
    createdAt: 'created_at'
  }
};

const studentBeneficiariesSchema = {
  table: TABLES.STUDENT_BENEFICIARIES,
  columns: {
    studentBeneficiaryId: 'student_beneficiary_id',
    brandId: 'brand_id',
    studentName: 'student_name',
    studentId: 'student_id',
    campus: 'campus',
    createdAt: 'created_at'
  }
};

const externalPersonsSchema = {
  table: TABLES.EXTERNAL_PERSONS,
  columns: {
    externalPersonId: 'external_person_id',
    fullName: 'full_name',
    email: 'email',
    phoneNumber: 'phone_number',
    createdAt: 'created_at'
  }
};

const donorSchema = {
  table: TABLES.DONOR,
  columns: {
    donorId: 'donor_id',
    email: 'email',
    fullNameDonor: 'full_name_donor',
    phoneNumber: 'phone_number',
    userId: 'user_id',
    createdAt: 'created_at'
  }
};

const billingDetailsSchema = {
  table: TABLES.BILLING_DETAILS,
  columns: {
    billingDetailsId: 'billing_details_id',
    donorId: 'donor_id',
    taxId: 'tax_id',
    legalName: 'legal_name',
    postalCode: 'postal_code',
    taxRegime: 'tax_regime',
    createdAt: 'created_at'
  }
};

const donationsSchema = {
  table: TABLES.DONATIONS,
  columns: {
    donationId: 'donation_id',
    donorId: 'donor_id',
    causeId: 'cause_id',
    amount: 'amount',
    paymentStatus: 'payment_status',
    paidAt: 'paid_at',
    createdAt: 'created_at',
    targetType: 'target_type',
    studentBeneficiaryId: 'student_beneficiary_id',
    externalPersonId: 'external_person_id',
    representativeGroupId: 'representative_group_id',
    facilityId: 'facility_id',
    socialProgramId: 'social_program_id'
  }
};

const certificatesSchema = {
  table: TABLES.CERTIFICATES,
  columns: {
    certificateId: 'certificate_id',
    donationId: 'donation_id',
    honoreeName: 'honoree_name',
    honoreeEmail: 'honoree_email',
    personalMessage: 'personal_message',
    pdfUrl: 'pdf_url',
    createdAt: 'created_at'
  }
};

const ENUMS = {
  paymentStatus: ['pending', 'succeeded', 'failed', 'refunded'],
  recipientType: [
    'general',
    'student_internal',
    'student_external',
    'group',
    'facility',
    'program'
  ],
  groupCategory: ['deportivo', 'cultural', 'otro']
};

module.exports = {
  TABLES,
  ENUMS,
  brandsSchema,
  causesSchema,
  representativeGroupsSchema,
  facilitiesSchema,
  socialProgramsSchema,
  studentBeneficiariesSchema,
  externalPersonsSchema,
  donorSchema,
  billingDetailsSchema,
  donationsSchema,
  certificatesSchema
};

