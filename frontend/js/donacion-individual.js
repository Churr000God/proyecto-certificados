document.addEventListener('DOMContentLoaded', () => {
    // Clear session data on load to avoid conflicts
    localStorage.removeItem('session_donation_data');
    localStorage.removeItem('corporate_session_data');
    // localStorage.removeItem('certificate_pdf'); // Removed as we don't use it anymore

    // DOM Elements
    const topicsContainer = document.getElementById('topics-container');
    const specificTopicContainer = document.getElementById('specific-topic-container');
    const specificTopicSelect = document.getElementById('specific-topic-select');
    const recipientInput = document.getElementById('recipient-name');
    const messageInput = document.getElementById('personal-message');
    const amountSelect = document.getElementById('amount-select');
    const customAmountContainer = document.getElementById('custom-amount-container');
    const customAmountInput = document.getElementById('custom-amount');
    const amountError = document.getElementById('amount-error');
    const specifyBeneficiaryCheckbox = document.getElementById('specify-beneficiary');
    const beneficiaryFieldsContainer = document.getElementById('beneficiary-fields-container');
    const logoUpload = document.getElementById('logo-upload');
    const uploadArea = document.getElementById('upload-area');
    const uploadError = document.getElementById('upload-error');
    const totalDisplay = document.getElementById('total-display');
    const btnContinue = document.getElementById('btn-continue');

    // Preview Elements
    const certRecipient = document.getElementById('cert-recipient');
    const certCauseName = document.getElementById('cert-cause-name');
    const certLogo = document.getElementById('cert-logo');
    const certContainer = document.querySelector('.cert__container');
    const certPreviewWrapper = document.getElementById('certificate-preview');

    // Schema Definitions matching backend/src/db/schema.js
    const BENEFICIARY_SCHEMAS = {
        'student': {
            label: 'Estudiante',
            fields: [
                { name: 'studentName', label: 'Nombre Completo del Estudiante', type: 'text', placeholder: 'Ej. Juan Pérez', required: true },
                { name: 'studentId', label: 'Matrícula', type: 'text', placeholder: 'Ej. A01234567', required: true },
                { name: 'campus', label: 'Campus', type: 'select', options: ['Monterrey', 'Santa Fe', 'Guadalajara', 'Querétaro', 'Estado de México', 'Puebla', 'Sonora Norte', 'Laguna', 'Saltillo', 'Morelia', 'León', 'Irapuato', 'San Luis Potosí', 'Aguascalientes', 'Tampico', 'Ciudad Juárez', 'Chihuahua', 'Ciudad Obregón', 'Sinaloa', 'Zacatecas', 'Veracruz', 'Chiapas', 'Cuernavaca', 'Hidalgo', 'Toluca'], required: true }
            ]
        },
        'group': {
            label: 'Grupo Representativo',
            fields: [
                { name: 'name', label: 'Nombre del Grupo', type: 'text', placeholder: 'Ej. Borregos Salvajes', required: true },
                { name: 'category', label: 'Categoría', type: 'select', options: ['Deportivo', 'Cultural', 'Otro'], required: true },
                { name: 'campus', label: 'Campus', type: 'select', options: ['Monterrey', 'Santa Fe', 'Guadalajara', 'Querétaro', 'Estado de México', 'Puebla', 'Sonora Norte', 'Laguna', 'Saltillo', 'Morelia', 'León', 'Irapuato', 'San Luis Potosí', 'Aguascalientes', 'Tampico', 'Ciudad Juárez', 'Chihuahua', 'Ciudad Obregón', 'Sinaloa', 'Zacatecas', 'Veracruz', 'Chiapas', 'Cuernavaca', 'Hidalgo', 'Toluca'], required: true }
            ]
        },
        'facility': {
            label: 'Instalación / Infraestructura',
            fields: [
                { name: 'name', label: 'Nombre de la Instalación', type: 'text', placeholder: 'Ej. Biblioteca Central', required: true },
                { name: 'campus', label: 'Campus', type: 'select', options: ['Monterrey', 'Santa Fe', 'Guadalajara', 'Querétaro', 'Estado de México', 'Puebla', 'Sonora Norte', 'Laguna', 'Saltillo', 'Morelia', 'León', 'Irapuato', 'San Luis Potosí', 'Aguascalientes', 'Tampico', 'Ciudad Juárez', 'Chihuahua', 'Ciudad Obregón', 'Sinaloa', 'Zacatecas', 'Veracruz', 'Chiapas', 'Cuernavaca', 'Hidalgo', 'Toluca'], required: true }
            ]
        },
        'program': {
            label: 'Programa Social',
            fields: [
                { name: 'name', label: 'Nombre del Programa', type: 'text', placeholder: 'Ej. Líderes del Mañana', required: true }
            ]
        },
        'external_person': {
            label: 'Persona Externa',
            fields: [
                { name: 'fullName', label: 'Nombre Completo', type: 'text', placeholder: 'Ej. María García', required: true },
                { name: 'email', label: 'Correo Electrónico', type: 'email', placeholder: 'ejemplo@correo.com', required: true },
                { name: 'phoneNumber', label: 'Teléfono', type: 'tel', placeholder: 'Ej. 5512345678', required: true }
            ]
        }
    };

    // State
    let state = {
        selectedTheme: null,
        specificTopic: null,
        recipientName: '',
        personalMessage: '',
        amount: 0,
        isCustomAmount: false,
        hasCustomLogo: false,
        logoUrl: '',
        beneficiaryData: {} // Dynamic data for specific beneficiary
    };

    // Load Themes from LocalStorage
    loadThemes();

    // Initial State Check for Amount
    if (amountSelect.value === 'other') {
        state.isCustomAmount = true;
        customAmountContainer.classList.remove('hidden');
        customAmountContainer.style.display = 'block';
    } else {
        customAmountContainer.style.display = 'none';
    }

    // Event Listeners
    recipientInput.addEventListener('input', (e) => {
        state.recipientName = e.target.value;
        updatePreview();
        validateForm();
    });

    messageInput.addEventListener('input', (e) => {
        state.personalMessage = e.target.value;
        validateForm();
    });

    amountSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (value === 'other') {
            state.isCustomAmount = true;
            customAmountContainer.classList.remove('hidden');
            customAmountContainer.style.display = 'block';
            state.amount = 0; // Reset until valid input
        } else {
            state.isCustomAmount = false;
            customAmountContainer.classList.add('hidden');
            customAmountContainer.style.display = 'none';
            state.amount = parseFloat(value);
        }
        updateTotal();
        validateForm();
    });

    customAmountInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (isNaN(value) || value <= 0) {
            state.amount = 0;
            amountError.classList.add('hidden');
        } else if (value > 250000) {
            state.amount = 0;
            amountError.classList.remove('hidden');
        } else {
            state.amount = value;
            amountError.classList.add('hidden');
        }
        updateTotal();
        validateForm();
    });

    specifyBeneficiaryCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            const type = determineTargetType();
            renderBeneficiaryFields(type);
        } else {
            beneficiaryFieldsContainer.style.display = 'none';
            beneficiaryFieldsContainer.innerHTML = '';
            state.beneficiaryData = {};
        }
        validateForm();
    });

    specificTopicSelect.addEventListener('change', (e) => {
        state.specificTopic = e.target.value;
        
        // Re-render beneficiary fields if checkbox is checked
        if (specifyBeneficiaryCheckbox.checked) {
            const type = determineTargetType();
            renderBeneficiaryFields(type);
        }
        validateForm();
    });

    // Logo Upload
    uploadArea.addEventListener('click', () => logoUpload.click());
    
    logoUpload.addEventListener('change', handleLogoUpload);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            logoUpload.files = e.dataTransfer.files;
            handleLogoUpload();
        }
    });

    function handleLogoUpload() {
        const file = logoUpload.files[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
            showUploadError('Solo se permiten archivos PNG, JPG o SVG.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showUploadError('El archivo no debe superar los 5MB.');
            return;
        }

        showUploadError('', false);

        const reader = new FileReader();
        reader.onload = (e) => {
            state.hasCustomLogo = true;
            state.logoUrl = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    }

    function showUploadError(msg, show = true) {
        uploadError.textContent = msg;
        if (show) uploadError.classList.remove('hidden');
        else uploadError.classList.add('hidden');
    }

    function loadThemes() {
        let themes = [];
        let selectedCause = null;
        let menuConfig = null;

        try {
            const storedCause = localStorage.getItem('selected_cause');
            if (storedCause) selectedCause = JSON.parse(storedCause);

            const storedMenu = localStorage.getItem('menu_config');
            if (storedMenu) menuConfig = JSON.parse(storedMenu);
        } catch (e) {
            console.error('Error loading cause configuration', e);
        }

        if (menuConfig && menuConfig.menu_config) {
            const causes = menuConfig.menu_config.filter(c => !c.is_placeholder);
            
            if (causes.length > 0) {
                themes = causes.map(cause => {
                    const details = getThemeDetails(cause.cause_name);
                    return {
                        id: cause.cause_id,
                        name: cause.cause_name,
                        icon: details.icon,
                        color: details.color,
                        logo: details.logo,
                        targetType: details.targetType,
                        themeClass: details.themeClass,
                        topics: cause.topics || []
                    };
                });
            }
        }

        // Fallback
        if (themes.length === 0) {
            themes = [
                { id: 'becas', name: 'Becas', icon: '🎓', color: '#5f9598', logo: '../assets/beca.png', targetType: 'student', themeClass: 'cert-theme-becas', topics: [{ topic_id: 'beca-completa', topic_name: 'Beca Completa' }] },
                { id: 'salud', name: 'Salud', icon: '🏥', color: '#e74c3c', logo: '../assets/log tecsalud.png', targetType: 'external_person', themeClass: 'cert-theme-salud', topics: [] },
                { id: 'infraestructura', name: 'Infraestructura', icon: '🏗️', color: '#27ae60', logo: '../assets/Instalacioines.png', targetType: 'facility', themeClass: 'cert-theme-infraestructura', topics: [] },
                { id: 'equipo', name: 'Equipo', icon: '💻', color: '#f39c12', logo: '../assets/equipo.png', targetType: 'group', themeClass: 'cert-theme-equipo', topics: [] }
            ];
        }

        topicsContainer.innerHTML = '';
        let themeToSelect = null;

        themes.forEach(theme => {
            const btn = document.createElement('button');
            btn.className = 'topic-btn';
            btn.innerHTML = `
                <span class="topic-icon">${theme.icon}</span>
                <span class="topic-name">${theme.name}</span>
            `;
            btn.onclick = () => selectTheme(theme);
            topicsContainer.appendChild(btn);

            if (selectedCause && selectedCause.cause_id === theme.id) {
                themeToSelect = theme;
            }
        });
        
        if (!themeToSelect && themes.length > 0) {
            themeToSelect = themes[0];
        }

        if (themeToSelect) {
            selectTheme(themeToSelect);
        }
    }

    function getThemeDetails(name) {
        const lowerName = name.toLowerCase();
        
        // Becas -> Student
        if (lowerName.includes('beca')) {
            return { icon: '🎓', color: '#5f9598', logo: '../assets/beca.png', targetType: 'student', themeClass: 'cert-theme-becas' };
        }
        
        // Salud / Medicina -> External Person
        if (lowerName.includes('salud') || lowerName.includes('medicina') || lowerName.includes('hospital') || lowerName.includes('cirugía') || lowerName.includes('prevención')) {
            return { icon: '🏥', color: '#e74c3c', logo: '../assets/log tecsalud.png', targetType: 'external_person', themeClass: 'cert-theme-salud' };
        }
        
        // Infraestructura / Instalaciones -> Facility
        if (lowerName.includes('infraestructura') || lowerName.includes('instalaciones') || lowerName.includes('espacios') || lowerName.includes('laboratorio') || lowerName.includes('biblioteca')) {
            return { icon: '🏗️', color: '#27ae60', logo: '../assets/Instalacioines.png', targetType: 'facility', themeClass: 'cert-theme-infraestructura' };
        }
        
        // Equipo / Deporte / Cultura -> Group
        if (lowerName.includes('equipo') || lowerName.includes('deporte') || lowerName.includes('cultural') || lowerName.includes('borregos')) {
            return { icon: '🏆', color: '#f39c12', logo: '../assets/equipo.png', targetType: 'group', themeClass: 'cert-theme-equipo' };
        }
        
        // Comunidad / Social / Voluntariado -> Program
        if (lowerName.includes('comunidad') || lowerName.includes('social') || lowerName.includes('voluntariado') || lowerName.includes('sustentabilidad')) {
            return { icon: '🤝', color: '#9b59b6', logo: '../assets/equipo.png', targetType: 'program', themeClass: 'cert-theme-program' }; 
        }

        // Default
        return { icon: '✨', color: '#3498db', logo: '', targetType: 'program', themeClass: 'cert-theme-program' };
    }

    function selectTheme(theme) {
        state.selectedTheme = theme;
        state.specificTopic = null;
        
        const buttons = topicsContainer.querySelectorAll('.topic-btn');
        buttons.forEach(btn => {
            if (btn.innerText.includes(theme.name)) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        populateSpecificTopics(theme.topics);

        // Update beneficiary fields if checked
        if (specifyBeneficiaryCheckbox.checked) {
            const type = determineTargetType();
            renderBeneficiaryFields(type);
        }

        updatePreview();
        validateForm();
    }

    function populateSpecificTopics(topics) {
        specificTopicSelect.innerHTML = '<option value="">-- General (Sin preferencia) --</option>';
        
        if (topics && topics.length > 0) {
            topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.topic_id;
                option.textContent = topic.topic_name;
                specificTopicSelect.appendChild(option);
            });
            specificTopicContainer.classList.remove('hidden');
        } else {
            specificTopicContainer.classList.add('hidden');
        }
    }

    function determineTargetType() {
        // 1. Try specific topic name if selected
        if (state.specificTopic && state.selectedTheme && state.selectedTheme.topics) {
            const topic = state.selectedTheme.topics.find(t => t.topic_id === state.specificTopic);
            if (topic) {
                const details = getThemeDetails(topic.topic_name);
                if (details.targetType) return details.targetType;
            }
        }
        // 2. Fallback to Theme targetType
        if (state.selectedTheme && state.selectedTheme.targetType) {
            return state.selectedTheme.targetType;
        }
        return 'program'; // Default
    }

    function renderBeneficiaryFields(type) {
        beneficiaryFieldsContainer.innerHTML = '';
        state.beneficiaryData = {}; // Reset data

        const schema = BENEFICIARY_SCHEMAS[type] || BENEFICIARY_SCHEMAS['student'];
        
        const title = document.createElement('h4');
        title.textContent = `Datos para ${schema.label}`;
        title.style.marginBottom = '10px';
        title.style.color = 'var(--text-color)';
        beneficiaryFieldsContainer.appendChild(title);

        schema.fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = field.label + (field.required ? ' *' : '');
            group.appendChild(label);

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'form-input';
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    input.appendChild(option);
                });
                // Initialize default value in state
                state.beneficiaryData[field.name] = field.options[0];
            } else {
                input = document.createElement('input');
                input.type = field.type;
                input.className = 'form-input';
                input.placeholder = field.placeholder;
            }

            input.dataset.name = field.name;
            input.addEventListener('input', (e) => {
                state.beneficiaryData[field.name] = e.target.value;
                validateForm();
            });
            
            // For selects, listen to change
            if (field.type === 'select') {
                input.addEventListener('change', (e) => {
                    state.beneficiaryData[field.name] = e.target.value;
                    validateForm();
                });
            }

            group.appendChild(input);
            beneficiaryFieldsContainer.appendChild(group);
        });
        
        beneficiaryFieldsContainer.style.display = 'block';
    }

    function validateBeneficiaryFields() {
        if (!state.selectedTheme) return false;
        
        const type = determineTargetType();
        const schema = BENEFICIARY_SCHEMAS[type] || BENEFICIARY_SCHEMAS['student'];
        
        // Check if all required fields in schema are present in state.beneficiaryData and not empty
        for (const field of schema.fields) {
            if (field.required) {
                const value = state.beneficiaryData[field.name];
                if (!value || value.toString().trim() === '') {
                    return false;
                }
            }
        }
        return true;
    }

    function updatePreview() {
        certRecipient.textContent = state.recipientName || '[Nombre del Destinatario]';
        
        // Remove existing theme classes
        certPreviewWrapper.classList.remove('cert-theme-becas', 'cert-theme-salud', 'cert-theme-infraestructura', 'cert-theme-equipo', 'cert-theme-program');

        if (state.selectedTheme) {
            certCauseName.textContent = state.selectedTheme.name;
            
            // Add theme class
            if (state.selectedTheme.themeClass) {
                certPreviewWrapper.classList.add(state.selectedTheme.themeClass);
            }

            if (state.hasCustomLogo) {
                certLogo.src = state.logoUrl;
                certLogo.style.display = 'block';
            } else if (state.selectedTheme.logo) {
                certLogo.src = state.selectedTheme.logo;
                certLogo.style.display = 'block';
            } else {
                certLogo.style.display = 'none';
            }
        } else {
            certCauseName.textContent = 'Causa';
            if (state.hasCustomLogo) {
                certLogo.src = state.logoUrl;
            } else {
                certLogo.style.display = 'none';
            }
        }
    }

    function updateTotal() {
        totalDisplay.innerHTML = `$${state.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <small>MXN</small>`;
    }

    function validateForm() {
        const isThemeSelected = !!state.selectedTheme;
        const isRecipientFilled = state.recipientName.trim().length > 0;
        const isMessageFilled = state.personalMessage.trim().length > 0;
        const isAmountValid = state.amount > 0 && state.amount <= 250000;
        
        let isBeneficiaryValid = true;
        if (specifyBeneficiaryCheckbox.checked) {
            isBeneficiaryValid = validateBeneficiaryFields();
        }

        if (isThemeSelected && isRecipientFilled && isMessageFilled && isAmountValid && isBeneficiaryValid) {
            btnContinue.disabled = false;
            btnContinue.classList.remove('disabled');
            updateSessionData();
        } else {
            btnContinue.disabled = true;
            btnContinue.classList.add('disabled');
        }
    }

    // --- New Functionality: Session & PDF ---

    function updateSessionData() {
        const targetType = determineTargetType();
        
        // Construct object matching backend schema expectations (using camelCase for keys to match schema columns mapping)
        const sessionData = {
            donation: {
                amount: state.amount,
                causeId: state.selectedTheme ? state.selectedTheme.id : null,
                causeName: state.selectedTheme ? state.selectedTheme.name : null,
                targetType: targetType,
                specificTopicId: state.specificTopic,
                // These will be filled in next step
                studentBeneficiaryId: null, 
                externalPersonId: null,
                representativeGroupId: null,
                facilityId: null,
                socialProgramId: null
            },
            beneficiaryData: {
                type: targetType,
                data: state.beneficiaryData // Contains specific fields
            },
            certificate: {
                honoreeName: state.recipientName,
                personalMessage: state.personalMessage,
                theme: state.selectedTheme ? state.selectedTheme.themeClass : 'default'
            },
            customLogo: state.hasCustomLogo ? state.logoUrl : null,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('session_donation_data', JSON.stringify(sessionData));
    }

    async function generateCertificatePDF() {
        if (!state.recipientName) return;
        
        // Wait for libraries to load if not ready (simple check)
        if (!window.html2canvas || !window.jspdf) {
            alert('Las bibliotecas de PDF aún se están cargando. Por favor espere un momento.');
            return;
        }

        const element = document.querySelector('.cert__container');
        
        try {
            // Generate canvas from HTML
            const canvas = await html2canvas(element, {
                scale: 1, // Reduced resolution to fix QuotaExceededError
                useCORS: true,
                logging: false,
                backgroundColor: null
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'letter'
            });
            
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Center vertically
            const y = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
            
            pdf.addImage(imgData, 'PNG', 0, y > 0 ? y : 0, pdfWidth, pdfHeight);
            
            // PDF Generation logic completed
            // We do NOT save the PDF to localStorage anymore to avoid QuotaExceededError
            // The PDF can be regenerated if needed, or passed via Blob/URL if immediate download is required.
            
            console.log('PDF generado exitosamente (en memoria)');
            
            return true;
        } catch (error) {
            console.error('Error generando PDF:', error);
            throw error;
        }
    }

    // Continue Button Handler
    btnContinue.addEventListener('click', async (e) => {
        e.preventDefault();
        if (btnContinue.disabled) return;
        
        const originalText = btnContinue.textContent;
        btnContinue.textContent = 'Generando certificado...';
        btnContinue.disabled = true;

        try {
            // Ensure latest data is saved
            updateSessionData();
            
            // Generate PDF
            await generateCertificatePDF();
            
            // Navigate to next step
            // alert('¡Listo! Datos guardados y certificado generado. Procediendo al pago...');
            window.location.href = 'inscripcion.html';
            
        } catch (error) {
            console.error(error);
            alert('Hubo un error al procesar. Por favor intente nuevamente.');
        } finally {
            btnContinue.textContent = originalText;
            btnContinue.disabled = false;
        }
    });

});
