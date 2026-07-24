(function () {
    const temaGuardado = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', temaGuardado);
    
    window.addEventListener('DOMContentLoaded', () => {
        const iconoTema = document.getElementById('icono-tema');
        if (iconoTema) {
            iconoTema.className = temaGuardado === 'dark' ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
    });
})();

const ESTADOS = {
    1: { label: 'Pendiente', bg: '#F0A202', text: '#1E2A28' },
    2: { label: 'Confirmada', bg: '#2E6FD9', text: '#fff' },
    3: { label: 'Cancelada', bg: '#E23D32', text: '#fff' },
    4: { label: 'Completada', bg: '#6c757d', text: '#fff' },
};

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
                            // las citas canceladas no cuentan como "día con citas"
                            if (cita.fecha_inicio && cita.estado !== 3) {
                                fechasConCitasSet.add(cita.fecha_inicio.split('T')[0]);
                            }
                            const estadoInfo = ESTADOS[cita.estado] || ESTADOS[1];
                            return {
                                id: cita.id_cita,
                                title: `${cita.nombre_cliente || 'Cliente'} — ${cita.servicio || 'Servicio'}`,
                                start: cita.fecha_inicio,
                                end: cita.fecha_fin || cita.fecha_inicio,
                                backgroundColor: estadoInfo.bg,
                                borderColor: estadoInfo.bg,
                                textColor: estadoInfo.text,
                                extendedProps: {
                                    telefono: cita.telefono,
                                    estado: cita.estado
                                }
                            };
                        });

                        // Refrescar el calendario para aplicar colores en celdas
                        calendar.render();
                        actualizarPanelesLaterales(data.citas);
                        actualizarPanelesEstado(data.citas);
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
        eventClick: function (info) {
            const esOscuro = document.documentElement.getAttribute('data-bs-theme') === 'dark';
            const estadoActual = info.event.extendedProps.estado || 1;
            const estadoInfo = ESTADOS[estadoActual] || ESTADOS[1];

            const horaInicio = info.event.start
                ? info.event.start.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'N/A';
            const horaFin = info.event.end
                ? info.event.end.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'N/A';

            Swal.fire({
                title: `<span class="h5">Cita #${info.event.id}</span>`,
                html: `
                    <div class="detalle-cita">
                        <div class="detalle-header">
                            <span class="badge-estado-grande" style="background:${estadoInfo.bg}; color:${estadoInfo.text};">${estadoInfo.label}</span>
                        </div>

                        <div class="detalle-fila">
                            <div class="detalle-icono"><i class="fa-solid fa-user"></i></div>
                            <div>
                                <div class="detalle-label">Cliente</div>
                                <div class="detalle-valor">${info.event.title.split(' — ')[0]}</div>
                            </div>
                        </div>

                        <div class="detalle-fila">
                            <div class="detalle-icono"><i class="fa-solid fa-stethoscope"></i></div>
                            <div>
                                <div class="detalle-label">Servicio</div>
                                <div class="detalle-valor">${info.event.title.split(' — ')[1] || 'N/A'}</div>
                            </div>
                        </div>

                        <div class="detalle-fila">
                            <div class="detalle-icono"><i class="fa-solid fa-phone"></i></div>
                            <div>
                                <div class="detalle-label">Teléfono</div>
                                <div class="detalle-valor">${info.event.extendedProps.telefono || 'N/A'}</div>
                            </div>
                        </div>

                        <div class="detalle-fila">
                            <div class="detalle-icono"><i class="fa-regular fa-calendar"></i></div>
                            <div>
                                <div class="detalle-label">Fecha</div>
                                <div class="detalle-valor">${info.event.start.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                            </div>
                        </div>

                        <div class="detalle-fila">
                            <div class="detalle-icono"><i class="fa-regular fa-clock"></i></div>
                            <div>
                                <div class="detalle-label">Horario</div>
                                <div class="detalle-valor">${horaInicio} – ${horaFin}</div>
                            </div>
                        </div>
                    </div>
                `,
                icon: 'none',
                showDenyButton: true,
                showCancelButton: estadoActual === 3,
                confirmButtonText: 'Cerrar',
                denyButtonText: '<i class="fa-solid fa-pen me-1"></i> Editar',
                cancelButtonText: '<i class="fa-solid fa-trash me-1"></i> Eliminar',
                confirmButtonColor: '#6c757d',
                denyButtonColor: '#0E8074',
                cancelButtonColor: '#E23D32',
                background: esOscuro ? '#1B2023' : '#fff',
                color: esOscuro ? '#fff' : '#000',
                customClass: { popup: 'rounded-4' }
            }).then((result) => {
                if (result.isDenied) {
                    abrirEdicionCita(info.event);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    confirmarEliminarCita(info.event);
                }
            });
        }
    });

    calendar.render();
});

// Función para abrir el formulario flotante con SweetAlert2 (Nueva Cita)
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
                    <input type="date" id="swal-fecha" class="form-control form-control-sm" min="${new Date().toISOString().split('T')[0]}">
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
        confirmButtonColor: '#0E8074',
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

            // Validación de choque de horas si hay citas el mismo día
            const hoy = new Date();
            const eventosActuales = calendar.getEvents();
            const nuevaInicio = new Date(`${fecha}T${horaInicio}:00`);
            const nuevaFin = new Date(`${fecha}T${horaFin}:00`);

            for (let evento of eventosActuales) {
                // Si la cita está cancelada (estado 3), la ignoramos y permitimos el choque
                const estadoCita = parseInt(evento.extendedProps.estado);
                if (estadoCita === 3) {
                    continue; 
                }
                const inicioEvento = new Date(evento.start);
                const finEvento = evento.end ? new Date(evento.end) : new Date(inicioEvento.getTime() + 30 * 60000);
                if (nuevaInicio < finEvento && nuevaFin > inicioEvento) {
                    Swal.showValidationMessage('Conflicto: Ya existe una cita activa agendada en ese horario.');
                    return false;
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
                    // no mandamos "estado": el backend le pone 1 (Pendiente) por defecto
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
                title: 'Cita guardada correctamente (Pendiente)',
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

// Función para abrir el formulario de edición, precargado con los datos del evento (incluye estado)
function abrirEdicionCita(evento) {
    const esOscuro = document.documentElement.getAttribute('data-bs-theme') === 'dark';

    // Separamos nombre y servicio del título "Nombre — Servicio"
    const [nombreActual, servicioActual] = evento.title.split(' — ');
    const telefonoActual = evento.extendedProps.telefono || '';
    const estadoActual = evento.extendedProps.estado || 1;

    // Convertimos start/end (objetos Date) a los valores que esperan los inputs date/time
    const pad = (n) => String(n).padStart(2, '0');
    const fechaActual = `${evento.start.getFullYear()}-${pad(evento.start.getMonth() + 1)}-${pad(evento.start.getDate())}`;
    const horaInicioActual = `${pad(evento.start.getHours())}:${pad(evento.start.getMinutes())}`;
    const horaFinActual = evento.end
        ? `${pad(evento.end.getHours())}:${pad(evento.end.getMinutes())}`
        : '';

    Swal.fire({
        title: `Editar Cita #${evento.id}`,
        html: `
            <form id="form-editar-cita" class="text-start px-2">
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Nombre del Cliente</label>
                    <input type="text" id="swal-edit-nombre" class="form-control form-control-sm" value="${nombreActual || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Teléfono</label>
                    <input type="text" id="swal-edit-telefono" class="form-control form-control-sm" maxlength="8" value="${telefonoActual}">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Servicio</label>
                    <input type="text" id="swal-edit-servicio" class="form-control form-control-sm" value="${servicioActual || ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label small fw-semibold">Fecha</label>
                    <input type="date" id="swal-edit-fecha" class="form-control form-control-sm" value="${fechaActual}" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="row">
                    <div class="col-6 mb-3">
                        <label class="form-label small fw-semibold">Hora Inicio</label>
                        <input type="time" id="swal-edit-hora-inicio" class="form-control form-control-sm" value="${horaInicioActual}">
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small fw-semibold">Hora Fin</label>
                        <input type="time" id="swal-edit-hora-fin" class="form-control form-control-sm" value="${horaFinActual}">
                    </div>
                </div>
                <div class="mb-1">
                    <label class="form-label small fw-semibold">Estado</label>
                    <select id="swal-edit-estado" class="form-select form-select-sm">
                        <option value="1" ${estadoActual == 1 ? 'selected' : ''}>Pendiente</option>
                        <option value="2" ${estadoActual == 2 ? 'selected' : ''}>Confirmada</option>
                        <option value="3" ${estadoActual == 3 ? 'selected' : ''}>Cancelada</option>
                        <option value="4" ${estadoActual == 4 ? 'selected' : ''}>Completada</option>
                    </select>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0E8074',
        background: esOscuro ? '#1B2023' : '#fff',
        color: esOscuro ? '#fff' : '#000',
        customClass: { popup: 'rounded-4' },
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const nombre = document.getElementById('swal-edit-nombre').value.trim();
            const telefono = document.getElementById('swal-edit-telefono').value.trim();
            const servicio = document.getElementById('swal-edit-servicio').value.trim();
            const fecha = document.getElementById('swal-edit-fecha').value;
            const horaInicio = document.getElementById('swal-edit-hora-inicio').value;
            const horaFin = document.getElementById('swal-edit-hora-fin').value;
            const estado = parseInt(document.getElementById('swal-edit-estado').value);

            if (!nombre || !fecha || !horaInicio || !horaFin) {
                Swal.showValidationMessage('Completa nombre, fecha, hora de inicio y hora de fin.');
                return false;
            }

            if (horaInicio >= horaFin) {
                Swal.showValidationMessage('La hora de fin debe ser mayor a la hora de inicio.');
                return false;
            }

            const [anio, mes, dia] = fecha.split('-').map(Number);
            const diaSemana = new Date(anio, mes - 1, dia).getDay();
            if (diaSemana === 0 || diaSemana === 6) {
                Swal.showValidationMessage('No se permiten citas en fines de semana.');
                return false;
            }

            return fetch(`http://127.0.0.1:8000/citas/${evento.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre_cliente: nombre,
                    telefono: telefono,
                    servicio: servicio,
                    fecha_inicio: `${fecha}T${horaInicio}:00`,
                    fecha_fin: `${fecha}T${horaFin}:00`,
                    estado: estado
                })
            })
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => { throw new Error(err.detail || "Error al actualizar"); });
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
                title: 'Cita actualizada correctamente',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: esOscuro2 ? '#1B2023' : '#fff',
                color: esOscuro2 ? '#fff' : '#000'
            });
            calendar.refetchEvents();
        }
    });
}

// Confirma y elimina una cita (solo permitido si está en estado Cancelada, validado también en el backend)
function confirmarEliminarCita(evento) {
    const esOscuro = document.documentElement.getAttribute('data-bs-theme') === 'dark';

    Swal.fire({
        title: '¿Eliminar esta cita?',
        html: `Se eliminará permanentemente la cita de <strong>${evento.title.split(' — ')[0]}</strong>. Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#E23D32',
        cancelButtonColor: '#6c757d',
        background: esOscuro ? '#1B2023' : '#fff',
        color: esOscuro ? '#fff' : '#000',
        customClass: { popup: 'rounded-4' }
    }).then((result) => {
        if (!result.isConfirmed) return;

        fetch(`http://127.0.0.1:8000/citas/${evento.id}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.detail || 'Error al eliminar'); });
                }
                return res.json();
            })
            .then(() => {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Cita eliminada',
                    showConfirmButton: false,
                    timer: 2500,
                    background: esOscuro ? '#1B2023' : '#fff',
                    color: esOscuro ? '#fff' : '#000'
                });
                calendar.refetchEvents();
            })
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo eliminar',
                    text: err.message,
                    confirmButtonColor: '#E23D32',
                    background: esOscuro ? '#1B2023' : '#fff',
                    color: esOscuro ? '#fff' : '#000'
                });
            });
    });
}

// Función para cambiar de modo claro a oscuro y guardarlo correctamente
function alternarTema() {
    const htmlTag = document.documentElement;
    const iconoTema = document.getElementById('icono-tema');
    
    // Verificamos el tema actual
    const temaActual = htmlTag.getAttribute('data-bs-theme');

    if (temaActual === 'light') {
        htmlTag.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('theme', 'dark'); // <--- Guarda 'dark'
        if (iconoTema) iconoTema.className = "fa-solid fa-sun";
    } else {
        htmlTag.setAttribute('data-bs-theme', 'light');
        localStorage.setItem('theme', 'light'); // <--- Guarda 'light'
        if (iconoTema) iconoTema.className = "fa-solid fa-moon";
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
        if (!cita.fecha_inicio || cita.estado === 3) return; // ignora sin fecha y canceladas
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
        panelHoy.innerHTML = citasHoy.map(c => {
            const estadoInfo = ESTADOS[c.estado] || ESTADOS[1];
            return `
                <div class="evento-item" style="border-left-color: ${estadoInfo.bg};">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="fw-semibold text-body text-truncate">${c.nombre_cliente || 'Sin nombre'}</div>
                        <span class="badge" style="background:${estadoInfo.bg}; color:${estadoInfo.text}; font-size: 0.65rem;">${estadoInfo.label}</span>
                    </div>
                    <div class="text-muted small">${c.servicio || 'Servicio general'}</div>
                    <div class="text-warning-emphasis small mt-1"><i class="fa-solid fa-phone me-1" style="font-size: 0.75rem;"></i>${c.telefono || 'N/A'}</div>
                </div>
            `;
        }).join('');
    } else {
        panelHoy.innerHTML = `<div class="text-muted small py-2">Sin citas para hoy.</div>`;
    }

    if (citasProximas.length > 0) {
        panelProximos.innerHTML = citasProximas.map(c => {
            const estadoInfo = ESTADOS[c.estado] || ESTADOS[1];
            return `
                <div class="evento-item" style="border-left-color: ${estadoInfo.bg};">
                    <div class="d-flex justify-content-between align-items-start">
                        <span class="badge bg-secondary-subtle text-secondary border mb-1" style="font-size: 0.7rem;">${c.fecha_inicio.split('T')[0]}</span>
                        <span class="badge" style="background:${estadoInfo.bg}; color:${estadoInfo.text}; font-size: 0.65rem;">${estadoInfo.label}</span>
                    </div>
                    <div class="fw-semibold text-body text-truncate">${c.nombre_cliente || 'Sin nombre'}</div>
                    <div class="text-muted small">${c.servicio || 'Servicio general'}</div>
                </div>
            `;
        }).join('');
    } else {
        panelProximos.innerHTML = `<div class="text-muted small py-2">No hay próximos eventos recientes.</div>`;
    }
}

// Rellena las 4 pestañas del panel "CITAS POR ESTADO" y sus contadores
function actualizarPanelesEstado(citas) {
    const grupos = { 1: [], 2: [], 3: [], 4: [] };

    citas.forEach(c => {
        const estado = c.estado || 1;
        if (grupos[estado]) grupos[estado].push(c);
    });

    Object.keys(grupos).forEach(estadoKey => {
        const lista = grupos[estadoKey];
        const contenedor = document.getElementById(`panel-estado-${estadoKey}`);
        const badge = document.getElementById(`badge-estado-${estadoKey}`);
        badge.textContent = lista.length;

        // Ordena por fecha descendente (más reciente primero)
        lista.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));

        if (lista.length === 0) {
            contenedor.innerHTML = `<div class="text-muted small py-2">No hay citas en este estado.</div>`;
            return;
        }

        contenedor.innerHTML = lista.map(c => {
            const fechaStr = c.fecha_inicio ? c.fecha_inicio.split('T')[0] : 'N/A';
            return `
                <div class="evento-item" style="border-left-color: ${ESTADOS[estadoKey].bg};">
                    <span class="badge bg-secondary-subtle text-secondary border mb-1" style="font-size: 0.7rem;">${fechaStr}</span>
                    <div class="fw-semibold text-body text-truncate">${c.nombre_cliente || 'Sin nombre'}</div>
                    <div class="text-muted small">${c.servicio || 'Servicio general'}</div>
                </div>
            `;
        }).join('');
    });
}