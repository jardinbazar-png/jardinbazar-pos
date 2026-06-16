import React, { useState, useEffect, useRef } from "react";

// --- CONFIGURACIÓN DE ESTILOS ---
const s = {
  app: { display: "flex", height: "100vh", backgroundColor: "#f3f4f6", fontFamily: "system-ui, sans-serif" },
  sidebar: { width: 260, backgroundColor: "#111827", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "between", padding: 20 },
  brand: { fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 },
  nav: { display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  navBtn: (act) => ({ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", borderRadius: 8, border: "none", backgroundColor: act ? "#1f2937" : "transparent", color: act ? "#fff" : "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { height: 70, backgroundColor: "#fff", borderBottom: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" },
  content: { flex: 1, padding: 32, overflowY: "auto" },
  card: { backgroundColor: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  input: { width: "100%", padding: "12px 16px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn: { padding: "12px 24px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 },
  prodCard: { backgroundColor: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 },
  badge: (low) => ({ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: low ? "#fef2f2" : "#f0fdf4", color: low ? "#dc2626" : "#16a34a", width: "fit-content" }),
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { padding: 12, borderBottom: "1.5px solid #e5e7eb", color: "#4b5563", fontSize: 12, fontWeight: 700, textTransform: "uppercase" },
  td: { padding: 12, borderBottom: "1.5px solid #e5e7eb", color: "#1f2937", fontSize: 14 },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  cartItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, border: "1.5px solid #d1d5db", backgroundColor: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  alertBar: { backgroundColor: "#dc2626", color: "#fff", padding: "12px 20px", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, marginBottom: 20, fontWeight: 600, fontSize: 14 },
  cancelBtn: { flex: 1, padding: 12, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#4b5563", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: 12, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" },
  successFlash: { position: "fixed", bottom: 24, right: 24, background: "#16a34a", color: "#fff", padding: "16px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, fontWeight: 700, boxShadow: "0 10px 25px #16a34a44", zIndex: 2000 }
};

const fmtTime = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
const fmtDate = () => {
  const d = new Date();
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${dias[d.getDay()]}, ${d.getDate()} De ${meses[d.getMonth()]}`;
};

function App() {
  // --- ESTADOS ---
  const [view, setView] = useState("pos");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [payModal, setPayModal] = useState(false);
  const [efectivo, setEfectivo] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [online, setOnline] = useState(navigator.onLine);
  const [time, setTime] = useState(fmtTime());
  const [usuario, setUsuario] = useState({ name: "Admin", role: "ADMIN" });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showVentaRapida, setShowVentaRapida] = useState(false);
  const [selectedDept, setSelectedDept] = useState("Todos");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);

  // NUEVOS ESTADOS INTEGRADOS PARA DESCUENTOS, IVA Y TERCEROS
  const [tipoDescuento, setTipoDescuento] = useState("ninguno"); // "ninguno", "porcentaje", "fijo"
  const [valorDescuento, setValorDescuento] = useState(0);
  const [sinIva, setSinIva] = useState(false);
  const [esTercero, setEsTercero] = useState(false);
  const [nombreTercero, setNombreTercero] = useState("");

  // ESTADOS PARA EL NUEVO PRODUCTO
  const [newProd, setNewProd] = useState({ code: "", name: "", dept: "Abarrotes", cost: "", price: "", stock: "", min: "0" });

  const searchRef = useRef(null);

  // --- COMPORTAMIENTO INICIAL ---
  useEffect(() => {
    if (!usuario) return;
    loadProducts();
    
    const t = setInterval(() => setTime(fmtTime()), 1000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    
    const keys = (e) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F4" && cart.length > 0) { e.preventDefault(); setPayModal(true); }
      if (e.key === "F3") { e.preventDefault(); setShowVentaRapida(true); }
      if (e.key === "F5") { e.preventDefault(); agregarTicket(); }
      if (e.key === "Escape") { setPayModal(false); setShowVentaRapida(false); setShowAddProduct(false); }
    };
    window.addEventListener("keydown", keys);
    
    return () => {
      clearInterval(t);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("keydown", keys);
    };
  }, [usuario, cart]);

  // --- CONTROL DE FLASH NOTIFICACIONES ---
  const triggerFlash = (msg) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 2500);
  };

  // --- MANEJO DE DATOS ---
  const loadProducts = () => {
    const mock = [
      { code: "75903565", name: "3 Hojas Doble Filo Schick", dept: "Electr/Vest/otros", cost: 390, price: 690, stock: 19, min: 0 },
      { code: "7790272001005", name: "Aceite Natura 900ml", dept: "Abarrotes", cost: 1850, price: 2890, stock: 0, min: 0 },
      { code: "7794870056009", name: "Aceite Smart Price Vegetal 900ml", dept: "Abarrotes", cost: 1386, price: 2190, stock: 2, min: 2 },
      { code: "7804610290096", name: "Aceite Vegetal Mi Sol 900ml", dept: "Abarrotes", cost: 1204, price: 1990, stock: 0, min: 0 }
    ];
    setProducts(mock);
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    const p = {
      code: newProd.code,
      name: newProd.name,
      dept: newProd.dept,
      cost: parseFloat(newProd.cost) || 0,
      price: parseFloat(newProd.price) || 0,
      stock: parseInt(newProd.stock) || 0,
      min: parseInt(newProd.min) || 0
    };
    setProducts([p, ...products]);
    setShowAddProduct(false);
    setNewProd({ code: "", name: "", dept: "Abarrotes", cost: "", price: "", stock: "", min: "0" });
    triggerFlash("✅ Producto agregado correctamente");
  };

  const login = (user) => {
    setUsuario(user);
  };

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (p) => {
    if (p.stock <= 0) {
      triggerFlash("❌ Producto sin stock disponible");
      return;
    }
    const exist = cart.find((i) => i.code === p.code);
    if (exist) {
      if (exist.qty >= p.stock) {
        triggerFlash("❌ No hay suficiente stock en inventario");
        return;
      }
      setCart(cart.map((i) => i.code === p.code ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
    setSearch("");
    searchRef.current?.focus();
  };

  const updateQty = (code, mod) => {
    const item = cart.find((i) => i.code === code);
    const prod = products.find((p) => p.code === code);
    if (!item || !prod) return;
    const next = item.qty + mod;
    if (next <= 0) {
      setCart(cart.filter((i) => i.code !== code));
    } else {
      if (mod > 0 && next > prod.stock) {
        triggerFlash("❌ No queda más stock en inventario");
        return;
      }
      setCart(cart.map((i) => i.code === code ? { ...i, qty: next } : i));
    }
  };

  // --- CÁLCULO DE TOTALES (CON DESCUENTOS E IVA REUBICADOS) ---
  const baseSubtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  
  let totalDescuento = 0;
  if (tipoDescuento === "porcentaje") {
    totalDescuento = Math.round(baseSubtotal * (valorDescuento / 100));
  } else if (tipoDescuento === "fijo") {
    totalDescuento = Math.min(valorDescuento, baseSubtotal);
  }

  const subtotalConDescuento = baseSubtotal - totalDescuento;
  const totalFinal = sinIva ? Math.round(subtotalConDescuento / 1.19) : subtotalConDescuento;

  const handleVenta = () => {
    const vuelto = metodoPago === "efectivo" ? (parseInt(efectivo) || 0) - totalFinal : 0;
    if (metodoPago === "efectivo" && vuelto < 0) {
      triggerFlash("❌ El efectivo ingresado es menor al total");
      return;
    }

    // Actualizar stock localmente
    setProducts(products.map(p => {
      const inCart = cart.find(c => c.code === p.code);
      return inCart ? { ...p, stock: Math.max(0, p.stock - inCart.qty) } : p;
    }));

    setCart([]);
    setPayModal(false);
    setEfectivo("");
    
    // Resetear controles del modal de cobro para la siguiente venta
    setTipoDescuento("ninguno");
    setValorDescuento(0);
    setSinIva(false);
    setEsTercero(false);
    setNombreTercero("");

    triggerFlash(metodoPago === "efectivo" ? `💵 Venta procesada. Vuelto: $${vuelto.toLocaleString("es-CL")}` : "💳 Venta procesada con Tarjeta");
  };

  const agregarTicket = () => {
    triggerFlash("🎫 Ticket en espera agregado");
  };

  // --- FILTROS DE INVENTARIO ---
  const lowStockCount = products.filter(p => p.stock <= p.min).length;
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(invSearch.toLowerCase()) || p.code.includes(invSearch);
    const matchDept = selectedDept === "Todos" || p.dept === selectedDept;
    const matchStock = !showLowStockOnly || p.stock <= p.min;
    return matchSearch && matchDept && matchStock;
  });

  const depts = ["Todos", "Abarrotes", "Electr/Vest/otros"];

  if (!usuario) return <div style={{ padding: 40, textAlign: "center" }}>Iniciando sistema...</div>;

  return (
    <div style={s.app}>
      {/* MENÚ LATERAL */}
      <div style={s.sidebar}>
        <div>
          <div style={s.brand}>
            <span>🏪</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>JardínBazar</div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>Sistema POS</div>
            </div>
          </div>
          <div style={s.nav}>
            <button style={s.navBtn(view === "pos")} onClick={() => setView("pos")}>👜 Punto de Venta</button>
            <button style={s.navBtn(view === "inventario")} onClick={() => setView("inventario")}>📦 Inventario</button>
            <button style={s.navBtn(view === "caja")} onClick={() => setView("caja")}>$ Caja del Día</button>
            <button style={s.navBtn(view === "turnos")} onClick={() => setView("turnos")}>🕒 Turnos</button>
            <button style={s.navBtn(view === "reportes")} onClick={() => setView("reportes")}>📊 Reportes</button>
            <button style={s.navBtn(view === "usuarios")} onClick={() => setView("usuarios")}>👥 Usuarios</button>
          </div>
        </div>

        <div>
          {lowStockCount > 0 && (
            <div style={{ backgroundColor: "#7f1d1d", color: "#fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ {lowStockCount} con stock bajo
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #1f2937", paddingTop: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{usuario.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{usuario.name}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" }}>{usuario.role}</div>
            </div>
            <button style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16 }}>➔</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 11, color: "#9ca3af" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? "#10b981" : "#ef4444" }} />
            {online ? "En línea" : "Sin conexión"}
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={s.main}>
        {/* ENCABEZADO */}
        <div style={s.header}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{fmtDate()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#4b5563" }}>
              <div>VENTAS HOY: <strong style={{ color: "#111827", fontSize: 14 }}>0</strong></div>
              <div>TOTAL HOY: <strong style={{ color: "#111827", fontSize: 14 }}>$0</strong></div>
            </div>
            <div style={{ backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#1f2937", letterSpacing: 0.5 }}>{time}</div>
          </div>
        </div>

        {/* CONTENEDOR DE MODULOS */}
        <div style={s.content}>
          {/* MÓDULO PUNTO DE VENTA */}
          {view === "pos" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, height: "100%", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <input ref={searchRef} type="text" placeholder="🔍 Buscar por nombre o escanear código de barras... [F2]" style={s.input} value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
                  <button style={{ ...s.btn, backgroundColor: "#1f2937", color: "#fff", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setShowVentaRapida(true)}>⚡ Venta Rápida [F3]</button>
                </div>

                <div style={s.grid}>
                  {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)).map(p => (
                    <div key={p.code} style={s.prodCard} onClick={() => addToCart(p)}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", minHeight: 40 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>Código: {p.code}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>${p.price.toLocaleString("es-CL")}</span>
                        <span style={s.badge(p.stock <= p.min)}>{p.stock} un</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONTENEDOR DEL CARRITO */}
              <div style={{ ...s.card, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 160px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1.5px solid #f3f4f6", paddingBottom: 12 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Carrito Actual</span>
                  <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{cart.reduce((sum, i) => sum + i.qty, 0)} items</span>
                </div>

                <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: 14 }}>El carrito está vacío. Agrega productos o escanea un código.</div>
                  ) : (
                    cart.map(i => (
                      <div key={i.code} style={s.cartItem}>
                        <div style={{ flex: 1, paddingRight: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{i.name}</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>${i.price.toLocaleString("es-CL")} c/u</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button style={s.qtyBtn} onClick={() => updateQty(i.code, -1)}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{i.qty}</span>
                          <button style={s.qtyBtn} onClick={() => updateQty(i.code, 1)}>+</button>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", minWidth: 70, textAlign: "right", paddingLeft: 12 }}>
                          ${(i.price * i.qty).toLocaleString("es-CL")}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ borderTop: "1.5px solid #f3f4f6", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#4b5563" }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>${baseSubtotal.toLocaleString("es-CL")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "#111827", borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
                    <span>Total</span>
                    <span style={{ color: "#16a34a" }}>${baseSubtotal.toLocaleString("es-CL")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button style={{ ...s.btn, backgroundColor: "#f3f4f6", color: "#4b5563", flex: 1 }} onClick={agregarTicket}>📥 Espera [F5]</button>
                    <button style={{ ...s.btn, backgroundColor: cart.length === 0 ? "#9ca3af" : "#16a34a", color: "#fff", flex: 1.5, fontSize: 15, fontWeight: 700 }} disabled={cart.length === 0} onClick={() => setPayModal(true)}> Cobrar [F4] </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MÓDULO INVENTARIO */}
          {view === "inventario" && (
            <div style={s.card}>
              {/* TABS INTERNAS DEL INVENTARIO */}
              <div style={{ display: "flex", gap: 24, borderBottom: "1.5px solid #e5e7eb", marginBottom: 20, paddingBottom: 1 }}>
                <span style={{ color: "#16a34a", fontWeight: 700, borderBottom: "2.5px solid #16a34a", paddingBottom: 10, cursor: "pointer", fontSize: 14 }}>📦 Productos</span>
                <span style={{ color: "#6b7280", fontWeight: 600, paddingBottom: 10, cursor: "pointer", fontSize: 14 }}>⚠️ Mermas y pérdidas</span>
                <span style={{ color: "#6b7280", fontWeight: 600, paddingBottom: 10, cursor: "pointer", fontSize: 14 }}>🕒 Historial</span>
              </div>

              {/* CONTROL DE FILTROS */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 20, alignItems: "center" }}>
                <input type="text" placeholder="🔍 Buscar por nombre o código..." style={{ ...s.input, maxWidth: 360 }} value={invSearch} onChange={(e) => setInvSearch(e.target.value)} />
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <select style={{ ...s.input, padding: "10px 14px", width: "auto" }} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                    {depts.map(d => <option key={d} value={d}>{d === "Todos" ? "Todos los departamentos" : d}</option>)}
                  </select>
                  <button style={{ ...s.btn, backgroundColor: showLowStockOnly ? "#fee2e2" : "#fff", color: showLowStockOnly ? "#dc2626" : "#4b5563", border: "1.5px solid " + (showLowStockOnly ? "#f87171" : "#d1d5db"), padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setShowLowStockOnly(!showLowStockOnly)}>
                    ⏳ Stock bajo ({lowStockCount})
                  </button>
                  <button style={{ ...s.btn, backgroundColor: "#16a34a", color: "#fff", padding: "11px 20px" }} onClick={() => setShowAddProduct(true)}>+ Agregar producto</button>
                  <button style={{ ...s.btn, backgroundColor: "#fff", color: "#4b5563", border: "1.5px solid #d1d5db", padding: "10px 12px" }} onClick={loadProducts}>🔄</button>
                </div>
              </div>

              {/* TABLA DE PRODUCTOS */}
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Código</th>
                      <th style={s.th}>Producto</th>
                      <th style={s.th}>Depto.</th>
                      <th style={s.th}>Costo S/IVA</th>
                      <th style={s.th}>Costo C/IVA</th>
                      <th style={s.th}>Margen</th>
                      <th style={s.th}>Precio Venta</th>
                      <th style={s.th}>Stock</th>
                      <th style={s.th}>Mín.</th>
                      <th style={{ ...s.th, textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const costWithIva = Math.round(p.cost * 1.19);
                      const rawMargin = p.price > 0 ? ((p.price - costWithIva) / p.price) * 100 : 0;
                      const isLow = p.stock <= p.min;
                      return (
                        <tr key={p.code} style={{ backgroundColor: isLow ? "#ffffde" : "transparent" }}>
                          <td style={s.td}>{p.code}</td>
                          <td style={{ ...s.td, fontWeight: 700 }}>{p.name}</td>
                          <td style={s.td}><span style={{ backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>{p.dept}</span></td>
                          <td style={s.td}>${Math.round(p.cost).toLocaleString("es-CL")}</td>
                          <td style={s.td}>${costWithIva.toLocaleString("es-CL")} <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700 }}>IVA</span></td>
                          <td style={{ ...s.td, color: rawMargin > 25 ? "#16a34a" : "#ea580c", fontWeight: 600 }}>
                            {rawMargin > 25 ? "✓ " : "~ "}{rawMargin.toFixed(1)}%
                          </td>
                          <td style={{ ...s.td, fontWeight: 800 }}>${p.price.toLocaleString("es-CL")}</td>
                          <td style={s.td}><span style={{ ...s.badge(isLow), fontSize: 13, padding: "4px 10px" }}>{p.stock}</span></td>
                          <td style={s.td, { color: "#9ca3af" }}>{p.min}</td>
                          <td style={{ ...s.td, textAlign: "right", color: "#16a34a", fontWeight: 600, cursor: "pointer" }}>Editar</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "#6b7280" }}>{filteredProducts.length} productos listados</div>
            </div>
          )}

          {/* PARTE DE OTROS MODULOS */}
          {["caja", "turnos", "reportes", "usuarios"].includes(view) && (
            <div style={{ ...s.card, textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🛠️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Módulo en desarrollo</div>
              <div style={{ fontSize: 14 }}>Esta sección estará disponible en la próxima actualización del sistema.</div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE COBRO INTEGRADO Y COMPLETO --- */}
      {payModal && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modal, maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Finalizar Transacción</h3>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{cart.reduce((sum, i) => sum + i.qty, 0)} productos</span>
            </div>

            {/* SECCIÓN 1: CONTROL DE DESCUENTOS */}
            <div style={{ backgroundColor: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 8, textTransform: "uppercase" }}>Descuento Manual</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button type="button" style={{ ...s.btn, flex: 1, padding: "8px 12px", fontSize: 12, backgroundColor: tipoDescuento === "ninguno" ? "#1f2937" : "#fff", color: tipoDescuento === "ninguno" ? "#fff" : "#4b5563", border: "1.5px solid #d1d5db" }} onClick={() => { setTipoDescuento("ninguno"); setValorDescuento(0); }}>Ninguno</button>
                <button type="button" style={{ ...s.btn, flex: 1, padding: "8px 12px", fontSize: 12, backgroundColor: tipoDescuento === "porcentaje" ? "#1f2937" : "#fff", color: tipoDescuento === "porcentaje" ? "#fff" : "#4b5563", border: "1.5px solid #d1d5db" }} onClick={() => { setTipoDescuento("porcentaje"); setValorDescuento(0); }}>Porcentaje (%)</button>
                <button type="button" style={{ ...s.btn, flex: 1, padding: "8px 12px", fontSize: 12, backgroundColor: tipoDescuento === "fijo" ? "#1f2937" : "#fff", color: tipoDescuento === "fijo" ? "#fff" : "#4b5563", border: "1.5px solid #d1d5db" }} onClick={() => { setTipoDescuento("fijo"); setValorDescuento(0); }}>Monto ($)</button>
              </div>
              {tipoDescuento !== "ninguno" && (
                <input type="number" placeholder={tipoDescuento === "porcentaje" ? "Ej: 10 para 10%" : "Ej: 1500 para $1.500"} style={s.input} value={valorDescuento === 0 ? "" : valorDescuento} onChange={(e) => setValorDescuento(Math.max(0, parseFloat(e.target.value) || 0))} />
              )}
            </div>

            {/* SECCIÓN 2: IMPUESTOS Y PROVEEDOR EXTERNO */}
            <div style={{ backgroundColor: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#1f2937", cursor: "pointer" }}>
                <input type="checkbox" checked={sinIva} onChange={(e) => setSinIva(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                Venta Sin IVA (Descontar el 19%)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "#1f2937", cursor: "pointer" }}>
                <input type="checkbox" checked={esTercero} onChange={(e) => setEsTercero(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                Pertenece a un Tercero / Proveedor externo
              </label>

              {esTercero && (
                <input type="text" placeholder="Escribe el nombre del proveedor externo..." style={s.input} value={nombreTercero} onChange={(e) => setNombreTercero(e.target.value)} />
              )}
            </div>

            {/* SECCIÓN 3: MÉTODO DE PAGO */}
            <div style={s.modalGrid}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Método de Pago</label>
                <select style={s.input} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta">💳 Tarjeta Débito/Crédito</option>
                </select>
              </div>
              <div>
                {metodoPago === "efectivo" && (
                  <>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Efectivo Recibido</label>
                    <input type="number" placeholder="¿Con cuánto pagan?" style={s.input} value={efectivo} onChange={(e) => setEfectivo(e.target.value)} />
                  </>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: DESGLOSE FINAL */}
            <div style={{ borderTop: "1.5px solid #e5e7eb", paddingTop: 16, marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4b5563" }}>
                <span>Subtotal base:</span>
                <span>${baseSubtotal.toLocaleString("es-CL")}</span>
              </div>
              {totalDescuento > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                  <span>Descuento aplicado:</span>
                  <span>-${totalDescuento.toLocaleString("es-CL")}</span>
                </div>
              )}
              {sinIva && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#2563eb", fontWeight: 600 }}>
                  <span>Retención IVA (19%):</span>
                  <span>-${Math.round(subtotalConDescuento - totalFinal).toLocaleString("es-CL")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 900, color: "#111827", marginTop: 4 }}>
                <span>Total a Cobrar:</span>
                <span style={{ color: "#16a34a" }}>${totalFinal.toLocaleString("es-CL")}</span>
              </div>
              {metodoPago === "efectivo" && parseInt(efectivo) > totalFinal && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#1d4ed8", backgroundColor: "#eff6ff", padding: "8px 12px", borderRadius: 8, marginTop: 8 }}>
                  <span>Vuelto para el cliente:</span>
                  <span>${(parseInt(efectivo) - totalFinal).toLocaleString("es-CL")}</span>
                </div>
              )}
            </div>

            {/* ACCIONES DEL MODAL */}
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" style={s.cancelBtn} onClick={() => {
                setPayModal(false);
                setTipoDescuento("ninguno");
                setValorDescuento(0);
                setSinIva(false);
                setEsTercero(false);
                setNombreTercero("");
              }}>Cancelar</button>
              <button type="button" style={s.confirmBtn} onClick={handleVenta}>⚡ Registrar Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR PRODUCTO (INVENTARIO) */}
      {showAddProduct && (
        <div style={s.modalOverlay}>
          <form style={s.modal} onSubmit={handleAddProductSubmit}>
            <h3 style={{ margin: 0, marginBottom: 20, fontSize: 18, fontWeight: 800, color: "#111827" }}>Agregar Nuevo Producto</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Código de Barras</label>
                <input type="text" required style={s.input} value={newProd.code} onChange={(e) => setNewProd({ ...newProd, code: e.target.value })} placeholder="Escanee o digite el código" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Nombre del Producto</label>
                <input type="text" required style={s.input} value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} placeholder="Ej: Aceite Natura 900ml" />
              </div>
              <div style={s.modalGrid}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Departamento</label>
                  <select style={s.input} value={newProd.dept} onChange={(e) => setNewProd({ ...newProd, dept: e.target.value })}>
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Electr/Vest/otros">Electr/Vest/otros</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Costo Neto ($)</label>
                  <input type="number" required style={s.input} value={newProd.cost} onChange={(e) => setNewProd({ ...newProd, cost: e.target.value })} placeholder="Costo sin IVA" />
                </div>
              </div>
              <div style={s.modalGrid}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Precio Venta ($)</label>
                  <input type="number" required style={s.input} value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} placeholder="Precio mostrador" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Stock Inicial</label>
                  <input type="number" required style={s.input} value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} placeholder="Cantidad disponible" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Stock Mínimo (Alerta)</label>
                <input type="number" style={s.input} value={newProd.min} onChange={(e) => setNewProd({ ...newProd, min: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" style={s.cancelBtn} onClick={() => setShowAddProduct(false)}>Cancelar</button>
              <button type="submit" style={{ ...s.btn, backgroundColor: "#16a34a", color: "#fff", flex: 1 }}>Guardar en Inventario</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL VENTA RÁPIDA */}
      {showVentaRapida && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3 style={{ margin: 0, marginBottom: 16, fontSize: 17, fontWeight: 800 }}>⚡ Venta Rápida sin código</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: -8, marginBottom: 16 }}>Agrega un monto genérico directamente al carro de compras.</p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4b5563", marginBottom: 6, textTransform: "uppercase" }}>Monto a Cobrar ($)</label>
              <input type="number" placeholder="Ej: 5000" style={s.input} autoFocus onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseFloat(e.target.value);
                  if (val > 0) {
                    addToCart({ code: "GENERIC-" + Date.now(), name: "Venta Genérica Rápida", dept: "Abarrotes", cost: val * 0.7, price: val, stock: 999, min: 0 });
                    setShowVentaRapida(false);
                  }
                }
              }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" style={s.cancelBtn} onClick={() => setShowVentaRapida(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE FLASH DE ÉXITO */}
      {flashMessage && (
        <div style={s.successFlash}>
          <span>🔔</span>
          <span>{flashMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
