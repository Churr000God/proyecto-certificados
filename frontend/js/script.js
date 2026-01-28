document.getElementById('check-status-btn').addEventListener('click', async () => {
    const statusElement = document.getElementById('api-status');
    statusElement.textContent = 'Conectando...';
    
    try {
        // Asumiendo que el backend está en /api según la configuración de Nginx que haremos
        const response = await fetch('/api/');
        if (response.ok) {
            const data = await response.text();
            statusElement.textContent = 'Backend Online: ' + data;
            statusElement.style.color = 'green';
        } else {
            statusElement.textContent = 'Error al conectar con el backend';
            statusElement.style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        statusElement.textContent = 'Error de conexión';
        statusElement.style.color = 'red';
    }
});
