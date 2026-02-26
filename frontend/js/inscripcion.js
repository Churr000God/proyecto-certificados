document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const summaryQty = document.getElementById('summary-qty');
    const summaryTotal = document.getElementById('summary-total');
    const btnFinishPay = document.getElementById('btn-finish-pay');
    const paymentCards = document.querySelectorAll('.payment-card');
    
    // Form Elements to Pre-fill
    const donorNameInput = document.getElementById('donor-name');
    const donorEmailInput = document.getElementById('donor-email');
    
    // State
    let paymentMethod = 'stripe';
    let donationData = null;
    let source = 'unknown'; // 'individual' or 'corporate'

    // Load Data from LocalStorage
    loadSessionData();

    // AUTO-FILL: Rellenar datos automáticamente para facilitar pruebas
    // TODO: Remover o comentar en producción
    prefillTestData();

    // Event Listeners
    setupPaymentSelection();
    btnFinishPay.addEventListener('click', handlePayment);
    setupFormValidation(); // Inicializar validación del formulario

    function prefillTestData() {
        // Datos del Donante (Obligatorios)
        if (!donorNameInput.value) donorNameInput.value = "Donante de Prueba";
        if (!donorEmailInput.value) donorEmailInput.value = "contacto@donante.com";
        const phoneInput = document.getElementById('donor-phone');
        if (phoneInput && !phoneInput.value) phoneInput.value = "5512345678";

        // Datos Fiscales (Opcionales, pero rellenados para "completitud")
        document.getElementById('fiscal-rfc').value = "XAXX010101000";
        document.getElementById('fiscal-name').value = "Empresa de Prueba S.A. de C.V.";
        document.getElementById('fiscal-cp').value = "06600";
        document.getElementById('fiscal-address').value = "Av. Reforma 123, CDMX";
        document.getElementById('fiscal-email').value = "facturacion@donante.com";
        
        // Validar después de rellenar
        if (typeof validateForm === 'function') validateForm();
    }

    function setupFormValidation() {
        const requiredIds = [
            'donor-name', 'donor-email', 'donor-phone',
            'fiscal-rfc', 'fiscal-name', 'fiscal-cp', 'fiscal-address', 'fiscal-email'
        ];
        const inputs = requiredIds.map(id => document.getElementById(id));

        window.validateForm = function() {
            const allFilled = inputs.every(input => input && input.value.trim() !== '');
            btnFinishPay.disabled = !allFilled;
            
            if (!allFilled) {
                btnFinishPay.style.opacity = '0.5';
                btnFinishPay.style.cursor = 'not-allowed';
                btnFinishPay.title = "Completa todos los campos obligatorios (Donante y Fiscal)";
            } else {
                btnFinishPay.style.opacity = '1';
                btnFinishPay.style.cursor = 'pointer';
                btnFinishPay.title = "";
            }
        };

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', validateForm);
            }
        });

        // Validación inicial
        validateForm();
    }


    function loadSessionData() {
        const corporateData = localStorage.getItem('corporate_session_data');
        const individualData = localStorage.getItem('session_donation_data');

        if (corporateData) {
            source = 'corporate';
            donationData = JSON.parse(corporateData);
            renderCorporateSummary(donationData);
        } else if (individualData) {
            source = 'individual';
            donationData = JSON.parse(individualData);
            renderIndividualSummary(donationData);
        } else {
            // No data found - redirect back
            alert('No se encontraron datos de la donación. Volviendo al inicio.');
            window.location.href = '../index.html';
        }
    }

    function renderCorporateSummary(data) {
        if (data.type === 'corporate_bulk') {
            summaryQty.textContent = data.records.length;
            // Ensure totalAmount exists, otherwise sum up records
            const total = data.totalAmount || data.records.reduce((sum, r) => sum + (r.donation.amount || 0), 0);
            summaryTotal.textContent = formatCurrency(total);
        } else {
            // Single Corporate
            summaryQty.textContent = '1';
            const amount = data.donation ? data.donation.amount : 0;
            summaryTotal.textContent = formatCurrency(amount);
        }
    }

    function renderIndividualSummary(data) {
        summaryQty.textContent = '1';
        const amount = data.donation ? data.donation.amount : 0;
        summaryTotal.textContent = formatCurrency(amount);
        
        // Pre-fill Donor Info if available
        // Note: In individual flow, we might have captured name/email in previous steps? 
        // Currently the individual flow captures recipient name and message, but donor info is usually separate.
        // If we want to capture donor info from 'certificate.honoree_name' as a fallback, we could, but it's different.
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function setupPaymentSelection() {
        paymentCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove selected class from all
                paymentCards.forEach(c => c.classList.remove('selected'));
                // Add to clicked
                card.classList.add('selected');
                paymentMethod = card.dataset.method;
            });
        });
    }

    async function handlePayment() {
        // 0. Validar Método de Pago
        if (paymentMethod === 'paypal') {
            alert('¡Próximamente! Estamos trabajando para integrar PayPal.');
            return;
        }

        // 1. Validar formulario (aunque ya debería estar validado por el listener)
        if (typeof validateForm === 'function') validateForm();
        if (btnFinishPay.disabled) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        // 2. Construir objeto de datos según esquema
        const donorData = {
            fullNameDonor: document.getElementById('donor-name').value,
            email: document.getElementById('donor-email').value,
            phoneNumber: document.getElementById('donor-phone').value,
            createdAt: new Date().toISOString()
        };

        const billingData = {
            taxId: document.getElementById('fiscal-rfc').value,
            legalName: document.getElementById('fiscal-name').value,
            postalCode: document.getElementById('fiscal-cp').value,
            address: document.getElementById('fiscal-address').value, 
            fiscalEmail: document.getElementById('fiscal-email').value, // Agregado para validación
            taxRegime: '601', // Valor por defecto o agregar campo
            createdAt: new Date().toISOString()
        };

        // Preparar datos de donación desde localStorage
        let payload;
        
        if (donationData.type === 'corporate_bulk') {
            // LÓGICA PARA CARGA MASIVA
            payload = {
                donor: donorData,
                billingDetails: billingData,
                totalAmount: donationData.totalAmount,
                donations: donationData.records.map(record => {
                    const d = { ...record.donation };
                    // Normalizar claves si es necesario (aunque en bulk ya vienen bien estructuradas)
                    return {
                        donation: d,
                        certificate: record.certificate
                    };
                })
            };
        } else {
            // LÓGICA PARA DONACIÓN INDIVIDUAL / CORPORATIVA SIMPLE
            let finalDonationData = { ...donationData }; // Copia base
            
            // Normalizar claves para asegurar compatibilidad con el esquema del backend (camelCase)
            if (finalDonationData.donation) {
                if (finalDonationData.donation.cause_id && !finalDonationData.donation.causeId) {
                    finalDonationData.donation.causeId = finalDonationData.donation.cause_id;
                }
                if (finalDonationData.donation.cause_name && !finalDonationData.donation.causeName) {
                    finalDonationData.donation.causeName = finalDonationData.donation.cause_name;
                }
                if (finalDonationData.donation.target_type && !finalDonationData.donation.targetType) {
                    finalDonationData.donation.targetType = finalDonationData.donation.target_type;
                }
                if (finalDonationData.donation.specific_topic_id && !finalDonationData.donation.specificTopicId) {
                    finalDonationData.donation.specificTopicId = finalDonationData.donation.specific_topic_id;
                }
                // Mapear IDs específicos si están en snake_case
                ['student_beneficiary_id', 'external_person_id', 'representative_group_id', 'facility_id', 'social_program_id'].forEach(key => {
                    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                    if (finalDonationData.donation[key] && !finalDonationData.donation[camelKey]) {
                        finalDonationData.donation[camelKey] = finalDonationData.donation[key];
                    }
                });
            }
            
            payload = {
                donor: donorData,
                billingDetails: billingData,
                donation: {
                    ...finalDonationData.donation, // amount, causeId, etc.
                    paymentStatus: 'pending', // Inicialmente pendiente
                    paidAt: null
                },
                certificate: finalDonationData.certificate
            };
            
            // Validar que causeId esté presente
            if (!payload.donation.causeId) {
                alert('Error: No se ha seleccionado una causa válida. Por favor vuelve al inicio.');
                console.error('Missing causeId in payload:', payload);
                btnFinishPay.disabled = false;
                btnFinishPay.innerHTML = originalBtnContent;
                return;
            }
        }

        // 3. Guardar en LocalStorage (Simulando persistencia temporal)
        localStorage.setItem('pending_transaction', JSON.stringify(payload));
        
        // DEBUG: Mostrar JSONs en consola
        console.log('--- DEBUG: JSONs en LocalStorage ---');
        console.log('pending_transaction:', payload);
        console.log('------------------------------------');

        const originalBtnContent = btnFinishPay.innerHTML;
        btnFinishPay.disabled = true;
        btnFinishPay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFICANDO...';

        try {
            // 3.5 Verificar Límite de Donación (Solo para individual por ahora)
            if (donationData.type !== 'corporate_bulk') {
                const checkResponse = await fetch('http://localhost:3000/api/donations/check-limit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
    
                const checkResult = await checkResponse.json();
                if (!checkResponse.ok) {
                    throw new Error(checkResult.message || 'Límite de donación excedido');
                }
            }

            // 4. Simular Pasarela de Pago
            btnFinishPay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CONECTANDO CON BANCO...';
            
            // Simular tiempo de carga de la pasarela
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mostrar Modal de "Pasarela de Pago" (Simulado)
            const amountToPay = donationData.type === 'corporate_bulk' 
                ? (donationData.totalAmount || 0) 
                : (donationData.donation ? donationData.donation.amount : 0);

            const paymentSuccess = await showPaymentGatewayModal(amountToPay);

            if (paymentSuccess) {
                btnFinishPay.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO TRANSACCIÓN...';
                
                // 5. Enviar al Backend
                const endpoint = donationData.type === 'corporate_bulk'
                    ? 'http://localhost:3000/api/donations/process-bulk'
                    : 'http://localhost:3000/api/donations/process';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Éxito
                    
                    // Si es carga masiva, guardamos un resumen para el certificado
                    if (donationData.type === 'corporate_bulk') {
                        const summary = {
                            type: 'bulk',
                            count: result.count || payload.donations.length,
                            totalAmount: payload.totalAmount,
                            transactionId: result.transactionId,
                            date: new Date().toLocaleDateString()
                        };
                        localStorage.setItem('donation_summary', JSON.stringify(summary));
                    }

                    localStorage.removeItem('corporate_session_data');
                    localStorage.removeItem('session_donation_data');
                    localStorage.removeItem('pending_transaction');
                    
                    // Redirigir a descarga de certificado (o página de éxito)
                    // Asumimos que el backend devuelve un ID o URL
                    window.location.href = `descarga_certificado.html?id=${result.transactionId}`;
                } else {
                    throw new Error(result.message || 'Error en la transacción');
                }
            } else {
                // Cancelado por usuario
                btnFinishPay.innerHTML = originalBtnContent;
                btnFinishPay.disabled = false;
            }

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
            btnFinishPay.innerHTML = originalBtnContent;
            btnFinishPay.disabled = false;
        }
    }

    // Función auxiliar para mostrar el modal de pago simulado
    function showPaymentGatewayModal(amount) {
        return new Promise((resolve) => {
            // Crear modal dinámicamente
            const modalOverlay = document.createElement('div');
            modalOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); z-index: 9999;
                display: flex; justify-content: center; align-items: center;
            `;

            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background: white; padding: 2.5rem; border-radius: 12px;
                width: 90%; max-width: 480px; text-align: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-family: 'Segoe UI', sans-serif;
                position: relative;
                box-sizing: border-box;
            `;

            modalContent.innerHTML = `
                <div style="font-size: 3rem; color: #5f9598; margin-bottom: 1.5rem;">
                    <i class="fas fa-credit-card"></i>
                </div>
                <h2 style="margin: 0 0 0.5rem 0; color: #2d3748; font-size: 1.5rem;">Pasarela de Pago Segura</h2>
                <p style="margin: 0 0 2rem 0; color: #718096;">
                    Estás a punto de donar <strong style="color: #061e29; font-size: 1.3rem;">${formatCurrency(amount)}</strong>
                </p>
                
                <!-- Formulario de Tarjeta -->
                <div style="text-align: left; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label style="display:block; font-size: 0.85rem; color: #4a5568; margin-bottom: 0.5rem; font-weight: 600;">Número de Tarjeta</label>
                        <div style="position: relative;">
                            <input type="text" id="card-number" placeholder="0000 0000 0000 0000" maxlength="19" 
                                style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; background: #f7fafc;">
                            <i class="far fa-credit-card" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #a0aec0;"></i>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display:block; font-size: 0.85rem; color: #4a5568; margin-bottom: 0.5rem; font-weight: 600;">Vencimiento</label>
                            <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5"
                                style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; background: #f7fafc;">
                        </div>
                        <div>
                            <label style="display:block; font-size: 0.85rem; color: #4a5568; margin-bottom: 0.5rem; font-weight: 600;">CVC</label>
                            <div style="position: relative;">
                                <input type="text" id="card-cvc" placeholder="123" maxlength="3"
                                    style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; background: #f7fafc;">
                                <i class="fas fa-lock" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #a0aec0; font-size: 0.8rem;"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label style="display:block; font-size: 0.85rem; color: #4a5568; margin-bottom: 0.5rem; font-weight: 600;">Titular de la Tarjeta</label>
                        <input type="text" id="card-holder" placeholder="Nombre como aparece en la tarjeta"
                            style="width: 100%; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; background: #f7fafc;">
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <button id="btn-confirm-payment" disabled style="
                        background: #cbd5e0; color: white; border: none; padding: 1rem;
                        border-radius: 6px; cursor: not-allowed; width: 100%; font-size: 1rem;
                        font-weight: 700; transition: all 0.3s; letter-spacing: 0.5px;
                        box-shadow: none;
                    ">
                        PAGAR AHORA
                    </button>
                    <button id="btn-cancel-payment" style="
                        background: white; color: #e53e3e; border: 1px solid #e53e3e; padding: 0.8rem;
                        border-radius: 6px; cursor: pointer; width: 100%; font-size: 0.9rem;
                        font-weight: 600; transition: all 0.2s;
                    ">
                        CANCELAR OPERACIÓN
                    </button>
                </div>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            // Validación básica de tarjeta para activar botón
            const inputs = ['card-number', 'card-expiry', 'card-cvc', 'card-holder'];
            const btnPay = document.getElementById('btn-confirm-payment');

            function checkCardForm() {
                const allFilled = inputs.every(id => document.getElementById(id).value.trim() !== '');
                if (allFilled) {
                    btnPay.disabled = false;
                    btnPay.style.background = '#28a745';
                    btnPay.style.cursor = 'pointer';
                } else {
                    btnPay.disabled = true;
                    btnPay.style.background = '#ccc';
                    btnPay.style.cursor = 'not-allowed';
                }
            }

            inputs.forEach(id => {
                document.getElementById(id).addEventListener('input', (e) => {
                    // Formato simple para tarjeta (espacios cada 4)
                    if (id === 'card-number') {
                        let val = e.target.value.replace(/\D/g, '');
                        e.target.value = val.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                    }
                    // Formato simple fecha
                    if (id === 'card-expiry') {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length >= 2) {
                            e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4);
                        }
                    }
                    checkCardForm();
                });
            });

            // Event Listeners del Modal
            btnPay.addEventListener('click', () => {
                modalContent.innerHTML = `
                    <div style="font-size: 3rem; color: #28a745; margin-bottom: 1rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>¡Pago Aprobado!</h3>
                    <p>Procesando tu donación...</p>
                `;
                setTimeout(() => {
                    document.body.removeChild(modalOverlay);
                    resolve(true);
                }, 1500);
            });

            document.getElementById('btn-cancel-payment').addEventListener('click', () => {
                document.body.removeChild(modalOverlay);
                resolve(false);
            });
        });
    }
});
