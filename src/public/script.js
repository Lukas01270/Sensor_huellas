const API_BASE_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000" // 👉 tu servidor local
  : "https://fingerprint-api.onrender.com"; // 👉 reemplaza con tu dominio Render

const API_URL = `${API_BASE_URL}/api/fingerprint`;
let fingerIdPendiente = null;

// 📊 CARGAR REGISTROS CON FILTROS
async function cargarRegistros(fecha = null) {
    try {
        let url = API_URL + '/registros';
        if (fecha) {
            url += `?fecha=${fecha}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        const table = document.getElementById("dataTable");
        table.innerHTML = "";

        const estadoFiltro = document.getElementById("estadoFiltro");
        
        if (fecha) {
            estadoFiltro.textContent = `📅 Mostrando registros del ${fecha}`;
        } else {
            estadoFiltro.textContent = '📅 Mostrando últimos 7 días';
        }

        const huellas = data.data || data;
        
        if (huellas.length === 0) {
            table.innerHTML = '<tr><td colspan="4" class="no-data">No hay registros para esta fecha</td></tr>';
            return;
        }

        // Calcular estadísticas
        const hoy = new Date().toDateString();
        let registrosHoy = 0;
        let totalRegistros = huellas.length;

        huellas.forEach(row => {
            const fechaRegistro = new Date(row.fecha_registro || row.created_at);
            const esHoy = fechaRegistro.toDateString() === hoy;
            
            if (esHoy) registrosHoy++;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.finger_id}</td>
                <td>${row.nombre || "Sin nombre"}</td>
                <td class="columna-fecha">${fechaRegistro.toLocaleDateString()}</td>
                <td class="columna-hora">${fechaRegistro.toLocaleTimeString()}</td>
            `;
            table.appendChild(tr);
        });

        // Actualizar estadísticas
        actualizarEstadisticas(totalRegistros, registrosHoy);

    } catch (error) {
        console.error('Error cargando registros:', error);
        const table = document.getElementById("dataTable");
        table.innerHTML = '<tr><td colspan="4" class="error-message">Error al cargar registros</td></tr>';
    }
}

// 📈 ACTUALIZAR ESTADÍSTICAS
function actualizarEstadisticas(total, hoy) {
    const estadisticasContainer = document.getElementById('estadisticasContainer');
    
    estadisticasContainer.innerHTML = `
        <div class="tarjeta-estadistica">
            <h4>📊 Total Registros</h4>
            <div class="valor">${total}</div>
        </div>
        <div class="tarjeta-estadistica">
            <h4>📅 Registros Hoy</h4>
            <div class="valor">${hoy}</div>
        </div>
        <div class="tarjeta-estadistica">
            <h4>🕒 Última Actualización</h4>
            <div class="valor">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
}

// 📅 CARGAR REGISTROS DE HOY
function cargarRegistrosHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('filtroFecha').value = hoy;
    cargarRegistros(hoy);
}

// 🎯 INICIALIZAR FILTROS
function inicializarFiltros() {
    // Establecer fecha actual por defecto
    const fechaInput = document.getElementById('filtroFecha');
    fechaInput.value = new Date().toISOString().split('T')[0];
    
    // Cargar registros del día actual
    cargarRegistrosHoy();
}

// 📡 VERIFICAR CONSTANTEMENTE SI HAY HUELLAS PENDIENTES
async function verificarRegistrosPendientes() {
    try {
        const res = await fetch(API_URL + '/pendientes');
        if (res.ok) {
            const data = await res.json();
            if (data.pendiente && data.finger_id) {
                mostrarRegistroPendiente(data.finger_id);
            }
        }
    } catch (error) {
        // Silenciar errores de conexión
        console.log('No hay huellas pendientes');
    }
}

// 🎯 MOSTRAR FORMULARIO DE REGISTRO PENDIENTE
function mostrarRegistroPendiente(fingerId) {
    // Solo mostrar si no hay ya un pendiente activo
    if (!fingerIdPendiente) {
        fingerIdPendiente = fingerId;
        document.getElementById('fingerIdPendiente').textContent = fingerId;
        document.getElementById('registroPendiente').style.display = 'block';
        
        // Enfocar automáticamente el campo de nombre
        document.getElementById('nombrePendiente').focus();
        
        console.log(`📢 Mostrando registro pendiente para ID: ${fingerId}`);
    }
}

// ✅ REGISTRAR HUELLA PENDIENTE
document.getElementById("formRegistroPendiente").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!fingerIdPendiente) {
        alert("No hay huella pendiente de registro");
        return;
    }

    const nombre = document.getElementById("nombrePendiente").value.trim();

    if (!nombre) {
        alert("Por favor ingrese un nombre");
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                finger_id: fingerIdPendiente, 
                nombre: nombre 
            })
        });

        const result = await res.json();

        if (res.ok && result.success) {
            alert("¡Huella registrada con éxito!");
            cancelarRegistro();
            // Recargar los registros actualizados
            const fechaActual = document.getElementById('filtroFecha').value;
            cargarRegistros(fechaActual || null);
        } else {
            alert("Error al registrar: " + (result.message || "Error desconocido"));
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error de conexión al registrar huella");
    }
});

// ❌ CANCELAR REGISTRO
function cancelarRegistro() {
    fingerIdPendiente = null;
    document.getElementById('registroPendiente').style.display = 'none';
    document.getElementById('formRegistroPendiente').reset();
}

// 📝 REGISTRO MANUAL
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fingerId = document.getElementById("fingerId").value.trim();
    const name = document.getElementById("name").value.trim();

    if (!fingerId || !name) {
        alert("Por favor complete ambos campos");
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ finger_id: fingerId, nombre: name })
        });

        const result = await res.json();

        if (res.ok && result.success) {
            alert("¡Huella registrada con éxito!");
            document.getElementById("registerForm").reset();
            // Recargar los registros actualizados
            const fechaActual = document.getElementById('filtroFecha').value;
            cargarRegistros(fechaActual || null);
        } else {
            alert("Error al registrar: " + (result.message || "Error desconocido"));
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error de conexión");
    }
});

// 🚀 INICIAR SISTEMA
inicializarFiltros();
setInterval(verificarRegistrosPendientes, 3000);

// Actualizar registros cada 30 segundos
setInterval(() => {
    const fechaActual = document.getElementById('filtroFecha').value;
    cargarRegistros(fechaActual || null);
}, 30000);

// Mostrar estado inicial
console.log("✅ Sistema de huellas iniciado - Monitoreando registros pendientes...");