document.addEventListener('DOMContentLoaded', () => {
    // Clear session data specific to corporate on load
    localStorage.removeItem('corporate_session_data');
    localStorage.removeItem('session_donation_data');
    
    // --- DOM Elements ---
    const topicsContainer = document.getElementById('topics-container');
    const specificTopicContainer = document.getElementById('specific-topic-container');
    const specificTopicSelect = document.getElementById('specific-topic-select');
    const bulkUploadToggleContainer = document.getElementById('bulk-upload-toggle-container');
    const bulkUploadToggle = document.getElementById('bulk-upload-toggle');
    const singleDonationFields = document.getElementById('single-donation-fields');
    
    const recipientInput = document.getElementById('recipient-name');
    const messageInput = document.getElementById('personal-message');
    const amountSelect = document.getElementById('amount-select');
    const customAmountContainer = document.getElementById('custom-amount-container');
    const customAmountInput = document.getElementById('custom-amount');
    
    const logoUpload = document.getElementById('logo-upload');
    const uploadArea = document.getElementById('upload-area');
    const uploadError = document.getElementById('upload-error');
    
    const btnContinue = document.getElementById('btn-continue');
    const totalDisplay = document.getElementById('total-display');
    const mainStickyFooter = document.getElementById('main-sticky-footer');
    
    // Preview Elements
    const certRecipient = document.getElementById('cert-recipient');
    const certCauseName = document.getElementById('cert-cause-name');
    const certLogo = document.getElementById('cert-logo');
    const certPreview = document.getElementById('certificate-preview');

    // Bulk Elements
    const step1Design = document.getElementById('step-1-design');
    const step2Bulk = document.getElementById('step-2-bulk');
    const bulkDropZone = document.getElementById('bulk-drop-zone');
    const bulkFileInput = document.getElementById('bulk-file-input');
    const validationSection = document.getElementById('validation-section');
    const validationTableBody = document.getElementById('validation-table-body');
    const bulkSummaryBar = document.getElementById('bulk-summary-bar');
    const totalRecordsEl = document.getElementById('total-records');
    const bulkTotalAmountEl = document.getElementById('bulk-total-amount');
    const btnProcessBulk = document.getElementById('btn-process-bulk');
    const btnCancelBulk = document.getElementById('btn-cancel-bulk');
    const btnDownloadTemplate = document.getElementById('btn-download-template');
    const loadedFilenameEl = document.getElementById('loaded-filename');
    const bulkErrorMsg = document.getElementById('bulk-error-msg');
    
    // File Info Elements
    const fileInfoContainer = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name-display');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    const btnViewAllRecords = document.getElementById('view-all-records');
    
    // State
    let state = {
        selectedTheme: null,
        specificTopic: null,
        isBulkUpload: false,
        recipientName: '',
        personalMessage: '',
        amount: 0,
        isCustomAmount: false,
        hasCustomLogo: false,
        logoUrl: '',
        // Bulk Data
        uploadedFile: null,
        parsedData: [],
        validRecords: 0,
        bulkTotalAmount: 0,
        isExpanded: false
    };

    const BRAND_LOGOS = {
        '5ea2245d-4910-4c07-90b1-b668bfe02305': '../assets/logo tecmilenio.png', // Tecmilenio
        '93b67f3e-5f32-4f94-9df7-d93542980a58': '../assets/logo tec de monterrey.png', // Tec de Monterrey
        '577c62b2-cfe5-4157-a386-f940b47a12d5': '../assets/log tecsalud.png' // TecSalud
    };
    
    let currentBrandLogo = '../assets/logo tecmilenio.png'; // Default fallback

    // --- THEMES & INITIALIZATION ---
    
    function getThemeDetails(name) {
        const lowerName = name.toLowerCase();
        
        // Becas -> Student
        if (lowerName.includes('beca')) {
            return { icon: '🎓', color: '#5f9598', logo: '../assets/beca.png', themeClass: 'cert-theme-becas', targetType: 'student_internal' };
        }
        
        // Salud / Medicina -> External Person
        if (lowerName.includes('salud') || lowerName.includes('medicina') || lowerName.includes('hospital') || lowerName.includes('cirugía') || lowerName.includes('prevención')) {
            return { icon: '🏥', color: '#e74c3c', logo: '../assets/log tecsalud.png', themeClass: 'cert-theme-salud', targetType: 'student_external' };
        }
        
        // Infraestructura / Instalaciones -> Facility
        if (lowerName.includes('infraestructura') || lowerName.includes('instalaciones') || lowerName.includes('espacios') || lowerName.includes('laboratorio') || lowerName.includes('biblioteca')) {
            return { icon: '🏗️', color: '#27ae60', logo: '../assets/Instalacioines.png', themeClass: 'cert-theme-infraestructura', targetType: 'facility' };
        }
        
        // Equipo / Deporte / Cultura -> Group
        if (lowerName.includes('equipo') || lowerName.includes('deporte') || lowerName.includes('cultural') || lowerName.includes('borregos')) {
            return { icon: '🏆', color: '#f39c12', logo: '../assets/equipo.png', themeClass: 'cert-theme-equipo', targetType: 'group' };
        }
        
        // Comunidad / Social / Voluntariado -> Program
        if (lowerName.includes('comunidad') || lowerName.includes('social') || lowerName.includes('voluntariado') || lowerName.includes('sustentabilidad')) {
            return { icon: '🤝', color: '#9b59b6', logo: '../assets/equipo.png', themeClass: 'cert-theme-program', targetType: 'program' }; 
        }

        // Default
        return { icon: '✨', color: '#3498db', logo: '', themeClass: 'cert-theme-program', targetType: 'general' };
    }

    function loadThemesFromStorage() {
        let themes = [];
        const storedConfig = localStorage.getItem('menu_config');
        
        if (storedConfig) {
            try {
                const parsed = JSON.parse(storedConfig);
                const configArray = parsed.menu_config || [];
                
                themes = configArray
                    .filter(item => !item.is_placeholder)
                    .map(item => {
                        // Detect brand from first valid item
                        if (item.brand_id && BRAND_LOGOS[item.brand_id]) {
                            currentBrandLogo = BRAND_LOGOS[item.brand_id];
                        }
                        
                        const details = getThemeDetails(item.cause_name);
                        return {
                            id: item.cause_id,
                            label: item.cause_name,
                            icon: details.icon,
                            color: details.color,
                            logo: details.logo,
                            themeClass: details.themeClass,
                            targetType: details.targetType,
                            subcauses: item.topics || []
                        };
                    });
            } catch (e) {
                console.error('Error parsing menu_config:', e);
            }
        }

        // Fallback if no themes found
        if (themes.length === 0) {
            themes = [
                { id: 'becas', label: 'Becas', icon: '🎓', color: '#5f9598', logo: '../assets/beca.png', themeClass: 'cert-theme-becas', subcauses: [{ topic_id: 'default', topic_name: 'Beca General' }] },
                { id: 'salud', label: 'Salud', icon: '🏥', color: '#e74c3c', logo: '../assets/log tecsalud.png', themeClass: 'cert-theme-salud', subcauses: [] },
                { id: 'innovacion', label: 'Innovación', icon: '💡', color: '#ecc94b', logo: '../assets/equipo.png', themeClass: 'cert-theme-innovacion', subcauses: [] },
                { id: 'infraestructura', label: 'Infraestructura', icon: '🏗️', color: '#27ae60', logo: '../assets/Instalacioines.png', themeClass: 'cert-theme-infraestructura', subcauses: [] }
            ];
        }

        return themes;
    }

    let themes = [];

    function renderThemes() {
        themes = loadThemesFromStorage();
        topicsContainer.innerHTML = '';
        
        themes.forEach(theme => {
            const btn = document.createElement('button');
            btn.className = 'topic-btn';
            btn.innerHTML = `
                <span class="topic-icon">${theme.icon}</span>
                <span class="topic-name">${theme.label}</span>
            `;
            btn.onclick = () => selectTheme(theme, btn);
            topicsContainer.appendChild(btn);
        });
    }

    function selectTheme(theme, btnElement) {
        state.selectedTheme = theme;
        
        // UI Update
        document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        // Update Specific Topics
        specificTopicSelect.innerHTML = '<option value="">-- General (Sin preferencia) --</option>';
        if (theme.subcauses && theme.subcauses.length > 0) {
            specificTopicContainer.classList.remove('hidden');
            theme.subcauses.forEach(sub => {
                const opt = document.createElement('option');
                // Check if sub is object (from storage) or string (fallback legacy)
                const value = sub.topic_id || sub;
                const text = sub.topic_name || sub;
                opt.value = value;
                opt.textContent = text;
                specificTopicSelect.appendChild(opt);
            });
        } else {
            specificTopicContainer.classList.add('hidden');
        }

        // Toggle Bulk Option visibility (Only for Becas)
        // Check by name as ID might vary between brands
        // Use 'beca' to catch both 'Beca' and 'Becas'
        if (theme.label.toLowerCase().includes('beca')) {
            bulkUploadToggleContainer.classList.remove('hidden');
        } else {
            bulkUploadToggleContainer.classList.add('hidden');
            // If we switch away from Becas, reset bulk toggle
            bulkUploadToggle.checked = false;
            handleBulkToggle();
        }

        // Update Preview
        certCauseName.textContent = theme.label;
        updatePreview();

        validateStep1();
    }

    // --- TOGGLE BULK UPLOAD ---
    bulkUploadToggle.addEventListener('change', handleBulkToggle);

    function handleBulkToggle() {
        state.isBulkUpload = bulkUploadToggle.checked;
        
        if (state.isBulkUpload) {
            singleDonationFields.classList.add('hidden');
            // Update preview to generic
            certRecipient.textContent = "[Nombre del Colaborador]";
            totalDisplay.innerHTML = "--- <small>MXN</small>"; // Indeterminate amount until upload
            btnContinue.textContent = "Continuar a Carga Masiva ➔";
        } else {
            singleDonationFields.classList.remove('hidden');
            // Restore preview
            updatePreview();
            btnContinue.textContent = "Continuar a datos de envío ➔";
        }
        validateStep1();
    }

    // --- FORM HANDLERS (Single) ---
    recipientInput.addEventListener('input', (e) => {
        state.recipientName = e.target.value;
        updatePreview();
        validateStep1();
    });

    messageInput.addEventListener('input', (e) => {
        state.personalMessage = e.target.value;
    });

    amountSelect.addEventListener('change', (e) => {
        if (e.target.value === 'other') {
            state.isCustomAmount = true;
            customAmountContainer.classList.remove('hidden');
            state.amount = 0;
        } else {
            state.isCustomAmount = false;
            customAmountContainer.classList.add('hidden');
            state.amount = parseFloat(e.target.value);
        }
        updateTotal();
        validateStep1();
    });

    customAmountInput.addEventListener('input', (e) => {
        state.amount = parseFloat(e.target.value) || 0;
        updateTotal();
        validateStep1();
    });

    function updatePreview() {
        certRecipient.textContent = state.recipientName || '[Nombre del Destinatario]';

        // Remove existing theme classes
        certPreview.classList.remove('cert-theme-becas', 'cert-theme-salud', 'cert-theme-infraestructura', 'cert-theme-equipo', 'cert-theme-program', 'cert-theme-innovacion');

        if (state.selectedTheme) {
            certCauseName.textContent = state.selectedTheme.label;
            
            // Add theme class
            if (state.selectedTheme.themeClass) {
                certPreview.classList.add(state.selectedTheme.themeClass);
            }

            if (state.hasCustomLogo) {
            certLogo.src = state.logoUrl;
            certLogo.style.display = 'block';
        } else {
            // Default to Brand Logo if no custom logo provided
            certLogo.src = currentBrandLogo;
            certLogo.style.display = 'block';
        }
        } else {
            certCauseName.textContent = 'Causa';
            certLogo.style.display = 'none';
        }
    }

    function updateTotal() {
        totalDisplay.innerHTML = `$${state.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <small>MXN</small>`;
    }

    // --- LOGO UPLOAD ---
    uploadArea.addEventListener('click', () => logoUpload.click());
    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) return; // 5MB limit
        
        const reader = new FileReader();
        reader.onload = (e) => {
            state.logoUrl = e.target.result;
            state.hasCustomLogo = true;
            certLogo.src = state.logoUrl;
            certLogo.style.display = 'block';
            
            uploadArea.innerHTML = `
                <div class="upload-content">
                    <p class="upload-title">✅ Logo cargado</p>
                    <p class="upload-subtitle">${file.name}</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    });

    // --- VALIDATION & NAVIGATION ---
    function validateStep1() {
        let isValid = false;
        
        if (!state.selectedTheme) {
            btnContinue.disabled = true;
            return;
        }

        if (state.isBulkUpload) {
            // For bulk, we just need the theme selected (and logo optional)
            isValid = true;
        } else {
            // For single, we need recipient and amount
            isValid = state.recipientName.trim() !== '' && state.amount > 0;
        }

        btnContinue.disabled = !isValid;
    }

    btnContinue.addEventListener('click', () => {
        if (state.isBulkUpload) {
            goToBulkStep();
        } else {
            // Single donation flow
            const targetType = state.selectedTheme ? (state.selectedTheme.targetType || 'general') : 'general';
            
            const corporateData = {
                type: 'corporate_single',
                timestamp: new Date().toISOString(),
                donation: {
                    amount: state.amount,
                    cause_id: state.selectedTheme ? state.selectedTheme.id : null,
                    cause_name: state.selectedTheme ? state.selectedTheme.label : null,
                    target_type: targetType,
                    specific_topic_id: state.specificTopic,
                    student_beneficiary_id: null, 
                    external_person_id: null,
                    representative_group_id: null,
                    facility_id: null,
                    social_program_id: null
                },
                certificate: {
                    honoree_name: state.recipientName,
                    personal_message: state.personalMessage,
                    theme: state.selectedTheme ? state.selectedTheme.themeClass : 'default'
                },
                custom_logo: state.hasCustomLogo ? state.logoUrl : null
            };
            
            localStorage.setItem('corporate_session_data', JSON.stringify(corporateData));
            window.location.href = 'inscripcion.html';
        }
    });

    // --- BULK UPLOAD FLOW ---
    function goToBulkStep() {
        step1Design.style.display = 'none';
        mainStickyFooter.style.display = 'none'; // Hide main footer
        step2Bulk.classList.remove('hidden');
        
        // Update Indicators
        document.querySelector('.step[data-step="1"]').classList.remove('step--active');
        document.querySelector('.step[data-step="2"]').classList.add('step--active');
        document.querySelector('.step[data-step="2"] .step__label').textContent = "CARGA MASIVA";
        
        window.scrollTo(0, 0);
    }

    // Bulk File Handlers
    btnDownloadTemplate.addEventListener('click', () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nombre,Correo,Monto,CorreoBeneficiario\n"
            + "Alejandro Garcia,alejandro.garcia@tecmilenio.mx,2500,ejemplo@ejemplo.com\n"
            + "Carlos Ruiz,carlos.ruiz@tecdemonterrey.mx,3200,ejemplo@ejemplo.com";
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_becas.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    bulkDropZone.addEventListener('click', () => bulkFileInput.click());
    bulkDropZone.addEventListener('dragover', (e) => { e.preventDefault(); bulkDropZone.classList.add('dragover'); });
    bulkDropZone.addEventListener('dragleave', () => bulkDropZone.classList.remove('dragover'));
    bulkDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        bulkDropZone.classList.remove('dragover');
        handleBulkFile(e.dataTransfer.files[0]);
    });
    bulkFileInput.addEventListener('change', (e) => handleBulkFile(e.target.files[0]));

    function handleBulkFile(file) {
        if (!file) return;
        state.uploadedFile = file;
        
        // Update UI
        fileNameDisplay.textContent = file.name;
        loadedFilenameEl.textContent = file.name;
        fileInfoContainer.classList.remove('hidden');

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            processBulkData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    }

    function processBulkData(rows) {
        if (rows.length < 2) {
            alert('Archivo vacío.');
            return;
        }

        const dataRows = rows.slice(1);
        state.parsedData = [];
        state.validRecords = 0;
        state.bulkTotalAmount = 0;
        state.isExpanded = false; // Reset expansion state

        dataRows.forEach((row, index) => {
            if (row.length === 0) return;
            
            const name = row[0] || '';
            const email = row[1] || '';
            const amount = parseFloat((row[2] || '0').toString().replace(/[^0-9.]/g, '')) || 0;
            const beneficiaryEmail = row[3] || '';
            
            let status = 'Valido';
            
            if (!name || !email || amount <= 0) {
                status = 'Error';
            } else {
                state.validRecords++;
                state.bulkTotalAmount += amount;
            }

            state.parsedData.push({ id: index + 1, name, email, amount, beneficiaryEmail, status });
        });

        renderTable();

        validationSection.classList.remove('hidden');
        bulkSummaryBar.classList.remove('hidden');
        totalRecordsEl.textContent = state.validRecords;
        bulkTotalAmountEl.textContent = `$${state.bulkTotalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;

        // Validate Max Amount (250,000 MXN)
        if (state.bulkTotalAmount > 250000) {
            btnProcessBulk.disabled = true;
            btnProcessBulk.classList.add('btn-disabled');
            bulkErrorMsg.classList.remove('hidden');
        } else {
            btnProcessBulk.disabled = false;
            btnProcessBulk.classList.remove('btn-disabled');
            bulkErrorMsg.classList.add('hidden');
        }
    }

    function renderTable() {
        validationTableBody.innerHTML = '';
        const limit = state.isExpanded ? state.parsedData.length : 5;
        
        const recordsToRender = state.parsedData.slice(0, limit);
        
        recordsToRender.forEach(record => {
            const tr = document.createElement('tr');
            const statusClass = record.status === 'Valido' ? 'status-valid' : 'status-error';
            
            tr.innerHTML = `
                <td>${String(record.id).padStart(3, '0')}</td>
                <td><strong>${record.name}</strong></td>
                <td>${record.email}</td>
                <td>$${record.amount.toFixed(2)} MXN</td>
                <td class="${statusClass}">${record.status}</td>
                <td>${record.beneficiaryEmail || '-'}</td>
            `;
            validationTableBody.appendChild(tr);
        });

        // Toggle Button Visibility and Text
        if (state.parsedData.length > 5) {
            btnViewAllRecords.classList.remove('hidden');
            btnViewAllRecords.textContent = state.isExpanded ? 'Ver menos registros' : 'Ver todos los registros';
        } else {
            btnViewAllRecords.classList.add('hidden');
        }
    }

    btnViewAllRecords.addEventListener('click', () => {
        state.isExpanded = !state.isExpanded;
        renderTable();
    });

    btnCancelBulk.addEventListener('click', () => {
        if(confirm('¿Cancelar carga?')) location.reload();
    });

    btnRemoveFile.addEventListener('click', () => {
        // Reset State
        state.uploadedFile = null;
        state.parsedData = [];
        state.validRecords = 0;
        state.bulkTotalAmount = 0;
        state.isExpanded = false;
        
        // Reset Input
        bulkFileInput.value = '';
        
        // Reset UI
        fileInfoContainer.classList.add('hidden');
        validationSection.classList.add('hidden');
        bulkSummaryBar.classList.add('hidden');
        validationTableBody.innerHTML = '';
        totalRecordsEl.textContent = '0';
        bulkTotalAmountEl.textContent = '$0.00 MXN';
        
        // Reset Validation
        btnProcessBulk.disabled = false;
        btnProcessBulk.classList.remove('btn-disabled');
        bulkErrorMsg.classList.add('hidden');
    });

    btnProcessBulk.addEventListener('click', () => {
        if (state.validRecords === 0) {
            alert('No hay registros válidos.');
            return;
        }

        // Generate individual donation objects for each valid record
        const donations = state.parsedData
            .filter(r => r.status === 'Valido')
            .map(record => {
                const targetType = state.selectedTheme ? (state.selectedTheme.targetType || 'general') : 'general';
                
                return {
                    donation: {
                        amount: record.amount,
                        causeId: state.selectedTheme ? state.selectedTheme.id : null,
                        causeName: state.selectedTheme ? state.selectedTheme.label : null,
                        targetType: targetType,
                        specificTopicId: state.specificTopic,
                        // Initialize specific IDs as null
                        studentBeneficiaryId: null, 
                        externalPersonId: null,
                        representativeGroupId: null,
                        facilityId: null,
                        socialProgramId: null
                    },
                    beneficiaryData: {
                        type: targetType,
                        data: {
                            email: record.beneficiaryEmail || null,
                            name: record.name // In some cases the name is part of beneficiary data too
                        }
                    },
                    certificate: {
                        honoreeName: record.name,
                        personalMessage: state.personalMessage || '',
                        theme: state.selectedTheme ? state.selectedTheme.themeClass : 'default'
                    },
                    customLogo: state.hasCustomLogo ? state.logoUrl : null,
                    timestamp: new Date().toISOString()
                };
            });

        // Save to storage with enhanced structure
        const corporateData = {
            type: 'corporate_bulk',
            timestamp: new Date().toISOString(),
            theme: state.selectedTheme,
            totalAmount: state.bulkTotalAmount,
            records: donations // Array of full donation objects
        };
        
        localStorage.setItem('corporate_session_data', JSON.stringify(corporateData));
        // alert('Redirigiendo a pago...');
        window.location.href = 'inscripcion.html';
    });

    // Initialize
    renderThemes();
});