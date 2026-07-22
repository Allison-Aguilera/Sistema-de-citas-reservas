let calendar;
let fechasConCitasSet = new Set();

document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        // Pintar los días según reglas: Rojo (Sábado/Domingo), Amarillo (Citas), Libre (Normal)
        dayCellDidMount: function (info) {
            const diaSemana = info.date.getDay(); // 0 = Domingo, 6 = Sábado
            const fechaStr = info.date.toISOString().split('T')[0];

            if (diaSemana === 0 || diaSemana === 6) {
                info.el.classList.add('dia-bloqueado');
            } else if (fechasConCitasSet.has(fechaStr)) {
                info.el.classList.add('dia-con-citas');
            } else {
                info.el.classList.add('dia-libre');
            }
        },
        events: function (fetchInfo, successCallback, failureCallback) {
            fetch("http://127.0.0.1:8000/citas/")
                .then(response => response.json())
                .then(data => {
                    if (data.citas) {
                        fechasConCitasSet.clear();
                        const eventos = data.citas.map(cita => {
                            if (cita.fecha_inicio) {
                                fechasConCitasSet.add(cita.fecha_inicio.split('T')[0]);
                            }
                            return {
                                id: cita.id_cita,
                                title: `${cita.nombre_cliente || 'Cliente'} — ${cita.servicio || 'Servicio'}`,
                                start: cita.fecha_inicio,
                                end: cita.fecha_fin || cita.fecha_inicio,
                                backgroundColor: '#ffc107',
                                borderColor: '#ffc107',
                                textColor: '#000',
                                extendedProps: {
                                    telefono: cita.telefono,
                                    estado: cita.estado
                                }
                            };
                        });

                        // Refrescar el calendario para aplicar colores en celdas
                        calendar.render();
                        actualizarPanelesLaterales(data.citas);
                        successCallback(eventos);
                    } else {
                        successCallback([]);
                    }
                })
                .catch(error => {
                    console.error("Error al cargar citas:", error);
                    failureCallback(error);
                });
        },
        eventClick: function(info) {
        const esOscuro = document.documentElement.getAttribute('data-bs-theme') === 'dark';

        const horaInicio = info.event.start
            ? info.event.start.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : 'N/A';
        const horaFin = info.event.end
            ? info.event.end.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : 'N/A';

        Swal.fire({
            title: `<span class="h5">Cita #${info.event.id}</span>`,
            html: `
                <div class="text-start px-3 py-2">
                    <p class="mb-2"><strong>Cliente:</strong> ${info.event.title.split(' — ')[0]}</p>
                    <p class="mb-2"><strong>Servicio:</strong> ${info.event.title.split(' — ')[1] || 'N/A'}</p>
                    <p class="mb-2"><strong>Teléfono:</strong> ${info.event.extendedProps.telefono || 'N/A'}</p>
                    <p class="mb-2"><strong>Fecha:</strong> ${info.event.start.toLocaleDateString('es-HN')}</p>
                    <div class="row">
                        <div class="col-6">
                            <p class="mb-0"><strong>Hora inicio:</strong> ${horaInicio}</p>
                        </div>
                        <div class="col-6">
                            <p class="mb-0"><strong>Hora fin:</strong> ${horaFin}</p>
                        </div>
                    </div>
                </div>
            `,
            icon: 'none',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0E8074',
            background: esOscuro ? '#1B2023' : '#fff',
            color: esOscuro ? '#fff' : '#000',
            customClass: { popup: 'rounded-4' }
        });
    }
    });

    calendar.render();
});

// Función para abrir el formulario flotante con SweetAlert2
function abrirFormularioCita() {
    const esOscuro = document.documentElement.getAttribute('data-bs-theme') === 'dark';

    Swal.fire({
        title: 'Nueva Cita',
        html: `
            <form id="form-nueva-cita" class="text-start px-2 needs-validation" novalidate>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Nombre del Cliente</label>
                    <input type="text" id="swal-nombre" class="form-control form-control-sm" placeholder="Ej. Juan Pérez">
                    <div class="invalid-feedback">El nombre es obligatorio.</div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Teléfono</label>
                    <input type="text" id="swal-telefono" class="form-control form-control-sm" placeholder="Ej. 99999999" maxlength="8">
                    <div class="invalid-feedback" id="error-telefono">Debe tener exactamente 8 dígitos numéricos.</div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Servicio</label>
                    <input type="text" id="swal-servicio" class="form-control form-control-sm" placeholder="Ej. Consulta general">
                    <div class="invalid-feedback">El servicio es obligatorio.</div>
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Fecha</label>
                    <input type="date" id="swal-fecha" class="form-control form-control-sm">
                    <div class="invalid-feedback" id="error-fecha">Seleccione una fecha válida (Lunes a Viernes).</div>
                </div>
                <div class="row">
                    <div class="col-6 mb-3">
                        <label class="form-label small fw-semibold">Hora Inicio</label>
                        <input type="time" id="swal-hora-inicio" class="form-control form-control-sm">
                        <div class="invalid-feedback">Obligatorio.</div>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small fw-semibold">Hora Fin</label>
                        <input type="time" id="swal-hora-fin" class="form-control form-control-sm">
                        <div class="invalid-feedback" id="error-hora-fin">Debe ser mayor al inicio.</div>
                    </div>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cita',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#4f46e5',
        background: esOscuro ? '#212529' : '#fff',
        color: esOscuro ? '#fff' : '#000',
        customClass: { popup: 'rounded-4' },
        showLoaderOnConfirm: true,
        didOpen: () => {
            const inputNombre = document.getElementById('swal-nombre');
            const inputTelefono = document.getElementById('swal-telefono');
            const inputServicio = document.getElementById('swal-servicio');
            const inputFecha = document.getElementById('swal-fecha');
            const inputHoraInicio = document.getElementById('swal-hora-inicio');
            const inputHoraFin = document.getElementById('swal-hora-fin');

            // Función auxiliar para marcar verde/rojo dinámicamente
            const validarCampo = (input, esValido) => {
                if (input.value.trim() === '') {
                    input.classList.remove('is-valid', 'is-invalid');
                } else if (esValido) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                }
            };

            // 1. Nombre
            inputNombre.addEventListener('input', () => {
                validarCampo(inputNombre, inputNombre.value.trim().length > 0);
            });

            // 2. Teléfono (Solo números y 8 dígitos)
            inputTelefono.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
                const esValido = e.target.value.length === 8;
                validarCampo(inputTelefono, esValido);
            });

            // 3. Servicio
            inputServicio.addEventListener('input', () => {
                validarCampo(inputServicio, inputServicio.value.trim().length > 0);
            });

            // 4. Fecha (Lunes a Viernes)
            inputFecha.addEventListener('change', () => {
                if (!inputFecha.value) {
                    inputFecha.classList.remove('is-valid', 'is-invalid');
                    return;
                }
                const [anio, mes, dia] = inputFecha.value.split('-').map(Number);
                const fechaLocal = new Date(anio, mes - 1, dia);
                const diaSemana = fechaLocal.getDay();
                const esHabdíl = (diaSemana !== 0 && diaSemana !== 6);
                
                if (!esHabdíl) {
                    document.getElementById('error-fecha').textContent = 'No se puede agendar en fin de semana.';
                }
                validarCampo(inputFecha, esHabdíl);
            });

            // 5. Horas
            const validarHoras = () => {
                if (!inputHoraInicio.value || !inputHoraFin.value) return;
                const esValido = inputHoraInicio.value < inputHoraFin.value;
                validarCampo(inputHoraFin, esValido);
                if (esValido) validarCampo(inputHoraInicio, true);
            };

            inputHoraInicio.addEventListener('change', () => {
                validarCampo(inputHoraInicio, inputHoraInicio.value !== '');
                validarHoras();
            });
            inputHoraFin.addEventListener('change', validarHoras);
        },
        preConfirm: () => { 
            const nombre = document.getElementById('swal-nombre').value.trim();
            const telefono = document.getElementById('swal-telefono').value.trim();
            const servicio = document.getElementById('swal-servicio').value.trim();
            const fecha = document.getElementById('swal-fecha').value;
            const horaInicio = document.getElementById('swal-hora-inicio').value;
            const horaFin = document.getElementById('swal-hora-fin').value;

            // Validación general al presionar guardar
            if (!nombre || !telefono || !servicio || !fecha || !horaInicio || !horaFin) {
                Swal.showValidationMessage('Por favor completa todos los campos correctamente.');
                return false;
            }

            if (telefono.length !== 8) {
                Swal.showValidationMessage('El teléfono debe tener exactamente 8 dígitos.');
                return false;
            }

            if (horaInicio >= horaFin) {
                Swal.showValidationMessage('La hora de fin debe ser mayor a la hora de inicio.');
                return false;
            }

            const [anio, mes, dia] = fecha.split('-').map(Number);
            const fechaLocal = new Date(anio, mes - 1, dia);
            const diaSemana = fechaLocal.getDay();
            if (diaSemana === 0 || diaSemana === 6) {
                Swal.showValidationMessage('No se permiten citas en fines de semana.');
                return false;
            }

            // Validación de choque de horas si es el mismo día
            const hoy = new Date();
            if (fechaLocal.toDateString() === hoy.toDateString()) {
                const eventosActuales = calendar.getEvents();
                const nuevaInicio = new Date(`${fecha}T${horaInicio}:00`);
                const nuevaFin = new Date(`${fecha}T${horaFin}:00`);
                
                for (let evento of eventosActuales) {
                    const inicioEvento = new Date(evento.start);
                    const finEvento = evento.end ? new Date(evento.end) : new Date(inicioEvento.getTime() + 30 * 60000);

                    if (nuevaInicio < finEvento && nuevaFin > inicioEvento) {
                        Swal.showValidationMessage('Conflicto: Ya existe una cita agendada en ese horario para hoy.');
                        return false;
                    }
                }
            }

            const fechaInicioCompleta = `${fecha}T${horaInicio}:00`;
            const fechaFinCompleta = `${fecha}T${horaFin}:00`;

            return fetch("http://127.0.0.1:8000/citas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre_cliente: nombre,
                    telefono: telefono,
                    servicio: servicio,
                    fecha_inicio: fechaInicioCompleta,
                    fecha_fin: fechaFinCompleta
                })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.detail || "Error al guardar"); });
                }
                return res.json();
            })
            .catch(err => {
                Swal.showValidationMessage(`Error: ${err.message}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        const esOscuro2 = document.documentElement.getAttribute('data-bs-theme') === 'dark';

        if (result.isConfirmed && result.value) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Cita guardada correctamente',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: esOscuro2 ? '#212529' : '#fff',
                color: esOscuro2 ? '#fff' : '#000'
            });
            calendar.refetchEvents();
        }
    });
}

// Función para cambiar de modo claro a oscuro de manera fluida
function alternarTema() {
    const htmlTag = document.documentElement;
    const iconoTema = document.getElementById('icono-tema');

    if (htmlTag.getAttribute('data-bs-theme') === 'light') {
        htmlTag.setAttribute('data-bs-theme', 'dark');
        iconoTema.className = "fa-solid fa-sun";
    } else {
        htmlTag.setAttribute('data-bs-theme', 'light');
        iconoTema.className = "fa-solid fa-moon";
    }
}

function sumarDiasHabiles(fecha, diasHabiles) {
    let resultado = new Date(fecha);
    let sumados = 0;
    while (sumados < diasHabiles) {
        resultado.setDate(resultado.getDate() + 1);
        const dia = resultado.getDay(); // 0 = Domingo, 6 = Sábado
        if (dia !== 0 && dia !== 6) {
            sumados++;
        }
    }
    return resultado;
}


function actualizarPanelesLaterales(citas) {
    const panelHoy = document.getElementById("panel-hoy");
    const panelProximos = document.getElementById("panel-proximos");

    const hoyStr = new Date().toISOString().split('T')[0];

    let fechaLimite = sumarDiasHabiles(new Date(), 5);
    let limiteStr = fechaLimite.toISOString().split('T')[0];

    let citasHoy = [];
    let citasProximas = [];

    citas.forEach(cita => {
        if (!cita.fecha_inicio) return;
        let fechaCita = cita.fecha_inicio.split('T')[0];

        const [anio, mes, dia] = fechaCita.split('-').map(Number);
        const diaSemana = new Date(anio, mes - 1, dia).getDay();
        if (diaSemana === 0 || diaSemana === 6) return; // se salta sábado/domingo

        if (fechaCita === hoyStr) {
            citasHoy.push(cita);
        } else if (fechaCita > hoyStr && fechaCita <= limiteStr) {
            citasProximas.push(cita);
        }
    });

    if (citasHoy.length > 0) {
        panelHoy.innerHTML = citasHoy.map(c => `
                <div class="evento-item">
                    <div class="fw-semibold text-body text-truncate">${c.nombre_cliente || 'Sin nombre'}</div>
                    <div class="text-muted small">${c.servicio || 'Servicio general'}</div>
                    <div class="text-warning-emphasis small mt-1"><i class="fa-solid fa-phone me-1" style="font-size: 0.75rem;"></i>${c.telefono || 'N/A'}</div>
                </div>
            `).join('');
    } else {
        panelHoy.innerHTML = `<div class="text-muted small py-2">Sin citas para hoy.</div>`;
    }

    if (citasProximas.length > 0) {
        panelProximos.innerHTML = citasProximas.map(c => `
                <div class="evento-item" style="border-left-color: #64748b;">
                    <span class="badge bg-secondary-subtle text-secondary border mb-1" style="font-size: 0.7rem;">${c.fecha_inicio.split('T')[0]}</span>
                    <div class="fw-semibold text-body text-truncate">${c.nombre_cliente || 'Sin nombre'}</div>
                    <div class="text-muted small">${c.servicio || 'Servicio general'}</div>
                </div>
            `).join('');
    } else {
        panelProximos.innerHTML = `<div class="text-muted small py-2">No hay próximos eventos recientes.</div>`;
    }
}