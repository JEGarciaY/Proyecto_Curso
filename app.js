// app.js - lógica común para todas las páginas

// datos persistentes
let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];

/* ---------- UTIL ---------- */
function formatearCOP(num) {
  return num.toLocaleString('es-CO');
}

/* ---------- INVENTARIO ---------- */
function guardarInventario() {
  localStorage.setItem('inventario', JSON.stringify(inventario));
}

function agregarProducto() {
  const nombreEl = document.getElementById('nombre');
  const cantidadEl = document.getElementById('cantidad');
  const precioEl = document.getElementById('precio');
  if (!nombreEl || !cantidadEl || !precioEl) return;

  const nombre = nombreEl.value.trim();
  const cantidad = parseInt(cantidadEl.value);
  const precio = parseFloat(precioEl.value);

  if (!nombre || isNaN(cantidad) || isNaN(precio) || cantidad <= 0 || precio <= 0) {
    alert('Por favor completa los campos con valores válidos.');
    return;
  }

  const existe = inventario.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (existe) {
    existe.cantidad += cantidad;
    existe.subtotal = existe.cantidad * existe.precio;
  } else {
    inventario.push({ nombre, cantidad, precio, subtotal: cantidad * precio });
  }

  guardarInventario();
  mostrarInventario();
  nombreEl.value = ''; cantidadEl.value = ''; precioEl.value = '';
}

function eliminarProducto(nombre) {
  if (!confirm(`¿Eliminar "${nombre}" del inventario?`)) return;
  inventario = inventario.filter(p => p.nombre !== nombre);
  guardarInventario();
  mostrarInventario();
}

function mostrarInventario() {
  const tbody = document.getElementById('tablaInventario');
  const totalEl = document.getElementById('totalInventario');
  if (!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  inventario.forEach(p => {
    total += p.subtotal;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.cantidad}</td>
      <td>$${formatearCOP(p.precio)}</td>
      <td>$${formatearCOP(p.subtotal)}</td>
      <td><button class="eliminar" onclick="eliminarProducto('${p.nombre.replace(/'/g,"\\'")}')">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
  if (totalEl) totalEl.textContent = `Total: $${formatearCOP(total)}`;
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

  if (!nombre) { alert('Selecciona un producto.'); return; }
  if (isNaN(cantidad) || cantidad <= 0) { alert('Ingresa una cantidad válida.'); return; }

  const producto = inventario.find(p => p.nombre === nombre);
  if (!producto) { alert('Producto no encontrado.'); return; }
  if (producto.cantidad < cantidad) { alert('Stock insuficiente.'); return; }

  producto.cantidad -= cantidad;
  producto.subtotal = producto.cantidad * producto.precio;

  const totalVenta = cantidad * producto.precio;
  ventas.push({ nombre, cantidad, total: totalVenta, fecha: new Date().toLocaleDateString() });

  guardarInventario();
  localStorage.setItem('ventas', JSON.stringify(ventas));

  // actualizar UI
  mostrarVentas();
  cargarProductosVenta();
  mostrarInventario();

  cantidadEl.value = '';
}

function mostrarVentas() {
  const tbody = document.getElementById('tablaVentas');
  const totalEl = document.getElementById('totalVenta');
  if (!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  ventas.forEach(v => {
    total += v.total;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${v.nombre}</td><td>${v.cantidad}</td><td>$${formatearCOP(v.total)}</td>`;
    tbody.appendChild(tr);
  });
  if (totalEl) totalEl.textContent = `Total ventas: $${formatearCOP(total)}`;
}

function limpiarVentas() {
  if (!confirm('¿Borrar todo el historial de ventas?')) return;
  ventas = [];
  localStorage.removeItem('ventas');
  mostrarVentas();
}
