/* app.js - gestión de inventario y ventas (centralizado para todas las vistas) */
/* Versión con logs para depuración del botón Agregar */

try {
  let inventario = JSON.parse(localStorage.getItem('inventario')) || [
    { nombre: "Mouse", categoria: "Periféricos", precio: 35000, cantidad: 10 },
    { nombre: "Teclado", categoria: "Periféricos", precio: 70000, cantidad: 5 }
  ];
  let ventas = JSON.parse(localStorage.getItem('ventas')) || [];

  function guardarInventario() {
    localStorage.setItem('inventario', JSON.stringify(inventario));
  }
  function guardarVentas() {
    localStorage.setItem('ventas', JSON.stringify(ventas));
  }
  function formatearCOP(num) {
    return Number(num).toLocaleString('es-CO');
  }

  function mostrarAlerta(tipo, mensaje, tiempo = 3000) {
    const cont = document.getElementById('alertContainer');
    if (!cont) { console.log(`[ALERTA ${tipo}] ${mensaje}`); return; }
    const id = `a${Date.now()}`;
    cont.innerHTML = `
      <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    if (tiempo > 0) setTimeout(()=> {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    }, tiempo);
  }

  /* ---------- INVENTARIO UI ---------- */
  function mostrarInventarioUI() {
    const tbody = document.getElementById('tablaInventario');
    const totalEl = document.getElementById('totalInventario');
    if (!tbody) return;
    tbody.innerHTML = '';
    let total = 0;
    inventario.forEach((p, idx) => {
      total += (p.precio * p.cantidad);
      tbody.innerHTML += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${p.nombre}</td>
          <td class="text-center">${p.cantidad}</td>
          <td class="text-end">$${formatearCOP(p.precio)}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-primary me-1" onclick="abrirModalEditar(${idx})">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${idx})">Eliminar</button>
          </td>
        </tr>`;
    });
    if (totalEl) totalEl.textContent = `Total: $${formatearCOP(total)}`;
  }

  function initAgregarProducto() {
    const btn = document.getElementById('btnAgregar');
    if (!btn) { console.warn('initAgregarProducto: btnAgregar no encontrado'); return; }
    console.log('Registrando handler para btnAgregar');
    btn.addEventListener('click', () => {
      try {
        const nombreEl = document.getElementById('nombre');
        const cantidadEl = document.getElementById('cantidad');
        const precioEl = document.getElementById('precio');
        if (!nombreEl || !cantidadEl || !precioEl) {
          mostrarAlerta('danger', 'Campos del formulario no encontrados.');
          return;
        }
        const nombre = nombreEl.value?.trim();
        const cantidad = parseInt(cantidadEl.value);
        const precio = parseFloat(precioEl.value);
        console.log('Intentando agregar:', { nombre, cantidad, precio });

        if (!nombre || isNaN(cantidad) || isNaN(precio) || cantidad <= 0 || precio <= 0) {
          mostrarAlerta('warning', 'Completa los campos con valores válidos.');
          return;
        }
        const existe = inventario.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
        if (existe) {
          existe.cantidad += cantidad;
          existe.precio = precio;
        } else {
          inventario.push({ nombre, categoria: 'General', cantidad, precio });
        }
        guardarInventario();
        mostrarAlerta('success', 'Producto agregado.');
        nombreEl.value = ''; cantidadEl.value = ''; precioEl.value = '';
        mostrarInventarioUI();
        cargarProductosVenta();
      } catch (err) {
        console.error('Error en handler btnAgregar:', err);
        mostrarAlerta('danger', 'Error al agregar producto (ver consola).');
      }
    });
  }

  function eliminarProducto(index) {
    if (!confirm(`¿Eliminar "${inventario[index].nombre}"?`)) return;
    inventario.splice(index, 1);
    guardarInventario();
    mostrarAlerta('info', 'Producto eliminado.');
    mostrarInventarioUI();
    cargarProductosVenta();
  }

  window.abrirModalEditar = function (index) {
    const item = inventario[index];
    if (!item) { mostrarAlerta('danger', 'Producto no encontrado para editar.'); return; }
    const elIndex = document.getElementById('editIndex');
    const elNombre = document.getElementById('editProducto');
    const elCantidad = document.getElementById('editCantidad');
    const elPrecio = document.getElementById('editPrecio');
    if (!elIndex || !elNombre || !elCantidad || !elPrecio) {
      mostrarAlerta('danger', 'Campos de edición no encontrados.');
      return;
    }
    elIndex.value = index;
    elNombre.value = item.nombre;
    elCantidad.value = item.cantidad;
    elPrecio.value = item.precio;

    const modalEl = document.getElementById('editarModal');
    if (!modalEl) { mostrarAlerta('danger', 'Modal de edición no encontrado.'); return; }
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  };

  function initFormEditar() {
    const form = document.getElementById('formEditar');
    if (!form) { console.warn('initFormEditar: formEditar no encontrado'); return; }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const idx = parseInt(document.getElementById('editIndex').value);
      const nombre = document.getElementById('editProducto').value.trim();
      const cantidad = parseInt(document.getElementById('editCantidad').value);
      const precio = parseFloat(document.getElementById('editPrecio').value);
      if (!nombre || isNaN(cantidad) || isNaN(precio) || cantidad < 0 || precio < 0) {
        mostrarAlerta('warning', 'Valores inválidos en formulario de edición.');
        return;
      }
      inventario[idx].nombre = nombre;
      inventario[idx].cantidad = cantidad;
      inventario[idx].precio = precio;
      guardarInventario();
      mostrarAlerta('success', 'Producto actualizado.');
      mostrarInventarioUI();
      cargarProductosVenta();
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
      if (modalInstance) modalInstance.hide();
    });
  }

  /* ---------- VENTAS ---------- */
  function cargarProductosVenta() {
    const select = document.getElementById('productoVenta');
    if (!select) return;
    select.innerHTML = '';
    if (inventario.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No hay productos en inventario';
      select.appendChild(opt);
      return;
    }
    inventario.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.nombre;
      opt.textContent = `${p.nombre} — stock: ${p.cantidad}`;
      select.appendChild(opt);
    });
  }

  function realizarVenta() {
    const select = document.getElementById('productoVenta');
    const cantidadEl = document.getElementById('cantidadVenta');
    if (!select || !cantidadEl) return;
    const nombre = select.value;
    const cantidad = parseInt(cantidadEl.value);
    if (!nombre) { mostrarAlerta('warning', 'Selecciona un producto.'); return; }
    if (isNaN(cantidad) || cantidad <= 0) { mostrarAlerta('warning', 'Ingresa una cantidad válida.'); return; }

    const producto = inventario.find(p => p.nombre === nombre);
    if (!producto) { mostrarAlerta('danger', 'Producto no encontrado.'); return; }
    if (producto.cantidad < cantidad) { mostrarAlerta('danger', 'Stock insuficiente.'); return; }

    producto.cantidad -= cantidad;
    const totalVenta = cantidad * producto.precio;
    ventas.push({ nombre, cantidad, total: totalVenta, fecha: new Date().toLocaleDateString() });

    guardarInventario();
    guardarVentas();
    mostrarAlerta('success', 'Venta registrada.');
    cantidadEl.value = '';
    mostrarVentasUI();
    mostrarInventarioUI();
    cargarProductosVenta();
  }

  function mostrarVentasUI() {
    const tbody = document.getElementById('tablaVentas');
    const totalEl = document.getElementById('totalVenta');
    if (!tbody) return;
    tbody.innerHTML = '';
    let total = 0;
    ventas.forEach((v, i) => {
      total += v.total;
      tbody.innerHTML += `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td>${v.nombre}</td>
          <td class="text-center">${v.cantidad}</td>
          <td class="text-end">$${formatearCOP(v.total)}</td>
          <td class="text-center">${v.fecha}</td>
        </tr>`;
    });
    if (totalEl) totalEl.textContent = `Total ventas: $${formatearCOP(total)}`;
  }

  function initVenderButtons() {
    const btnVender = document.getElementById('btnVender');
    if (btnVender) btnVender.addEventListener('click', realizarVenta);
    const btnLimpiar = document.getElementById('btnLimpiarVentas');
    if (btnLimpiar) btnLimpiar.addEventListener('click', () => {
      if (!confirm('¿Borrar todo el historial de ventas?')) return;
      ventas = [];
      guardarVentas();
      mostrarAlerta('info', 'Historial de ventas borrado.');
      mostrarVentasUI();
    });
  }

  /* ---------- Inicialización ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    console.log('app.js cargado - inicializando UI según la página');
    if (document.getElementById('tablaInventario')) {
      mostrarInventarioUI();
      initAgregarProducto();
      initFormEditar();
    }
    if (document.getElementById('productoVenta')) {
      cargarProductosVenta();
      initVenderButtons();
      mostrarVentasUI();
    }
  });

} catch (err) {
  console.error('Error crítico en app.js:', err);
}
