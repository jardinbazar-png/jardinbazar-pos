// JARDINBAZAR POS v7 — Eleventa Style
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import AddProduct from "./AddProduct.jsx";
import Login from "./Login.jsx";
import Usuarios from "./Usuarios.jsx";
import CierreCaja from "./CierreCaja.jsx";
import Turnos from "./Turnos.jsx";
import Inventario from "./Inventario.jsx";
import Ventas from "./Ventas.jsx";
import Ofertas from "./Ofertas.jsx";
import ServiciosExternos from "./ServiciosExternos.jsx";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);
const fmtTime = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
const fmtDate = () => new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

const Ico = ({ path, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={path} />
  </svg>
);

const I = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  cart:     "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  trash:    "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  plus:     "M12 5v14M5 12h14",
  minus:    "M5 12h14",
  cash:     "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  card:     "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 13h.01",
  transfer: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  check:    "M20 6L9 17l-5-5",
  x:        "M18 6L6 18M6 6l12 12",
  box:      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  chart:    "M18 20V10M12 20V4M6 20v-6",
  warn:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"
};

export default function POSApp() {
  const [usuario, setUsuario] = useState(null);
  const [view, setView] = useState("pos");
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([{ id: 1, nombre: "Ticket 1", cart: [] }]);
  const [ticketActivo, setTicketActivo] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState("efectivo");
  const [cashInput, setCashInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [time, setTime] = useState(fmtTime());
  const [online, setOnline] = useState(navigator.onLine);
  const [saleCount, setSaleCount] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showVentaRapida, setShowVentaRapida] = useState(false);
  const [ventaRapidaMonto, setVentaRapidaMonto] = useState("");
  const [ventaRapidaDesc, setVentaRapidaDesc] = useState("");
  const [fiadoNombre, setFiadoNombre] = useState("");
  const searchRef = useRef(null);
  const isAdmin = usuario?.rol === "admin";

  const [descuentoTipo, setDescuentoTipo] = useState("ninguno"); 
  const [descuentoValor, setDescuentoValor] = useState("");
  const [esTercero, setEsTercero] = useState(false);
  const [nombreTercero, setNombreTercero] = useState("");
  const [sinIva, setSinIva] = useState(false);
  const [ofertas, setOfertas] = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  const cart = tickets[ticketActivo]?.cart || [];
  const setCart = (fn) => {
    setTickets(prev => prev.map((t, i) => i === ticketActivo ? { ...t, cart: typeof fn === "function" ? fn(t.cart) : fn } : t));
  };

  const agregarTicket = () => {
    const nuevoId = tickets.length + 1;
    setTickets(prev => [...prev, { id: nuevoId, nombre: `Ticket ${nuevoId}`, cart: [] }]);
    setTicketActivo(tickets.length);
  };

  const cerrarTicket = (idx) => {
    if (tickets.length === 1) return;
    setTickets(prev => prev.filter((_, i) => i !== idx));
    setTicketActivo(Math.max(0, ticketActivo - 1));
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
    if (!error) setProducts(data || []);
    setLoading(false);
  }, []);

  const loadOfertas = useCallback(async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("ofertas")
      .select("*")
      .eq("activa", true)
      .or(`fecha_fin.is.null,fecha_fin.gte.${hoy}`);
    setOfertas(data || []);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    loadProducts();
    loadOfertas();
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
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const channel = supabase.channel("productos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, () => loadProducts())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadProducts, usuario]);

  if (!usuario) return <Login onLogin={(u) => { setUsuario(u); setView("pos"); }} />;

  // Búsqueda inteligente interactiva
  const filteredSearch = query.length > 0 ? products.filter(p => 
    p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
    p.codigo?.toString().includes(query)
  ) : [];

  const addToCart = (p) => {
    if (p.existencia <= 0) return;
    setCart(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) {
        if (exists.qty >= p.existencia) return prev;
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setQuery("");
    searchRef.current?.focus();
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const totalBruto = cart.reduce((s, i) => s + i.precio_venta * i.qty, 0);

  const calcularDescuento = () => {
    if (ofertaSeleccionada) {
      if (ofertaSeleccionada.tipo === "porcentaje") return Math.round(totalBruto * ofertaSeleccionada.valor / 100);
      if (ofertaSeleccionada.tipo === "monto_fijo") return ofertaSeleccionada.valor;
      if (ofertaSeleccionada.tipo === "2x1" && cart.length >= 2) {
        const sorted = [...cart].sort((a, b) => a.precio_venta - b.precio_venta);
        return sorted[0].precio_venta;
      }
    }
    if (descuentoTipo === "porcentaje" && descuentoValor) return Math.round(totalBruto * parseFloat(descuentoValor) / 100);
    if (descuentoTipo === "monto_fijo" && descuentoValor) return parseFloat(descuentoValor);
    return 0;
  };

  const descuentoAplicado = calcularDescuento();
  const total = Math.max(0, totalBruto - descuentoAplicado);
  const change = parseFloat(cashInput || 0) - total;

  const completeSale = async (montoExtra = 0, descExtra = "") => {
    const totalFinal = montoExtra > 0 ? montoExtra : total;
    if (totalFinal <= 0) return;
    
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert({
        total: totalFinal,
        metodo_pago: payMethod + (fiadoNombre ? `_fiado:${fiadoNombre}` : ""),
        descuento_monto: montoExtra > 0 ? 0 : descuentoAplicado,
        descuento_tipo: ofertaSeleccionada ? ofertaSeleccionada.tipo : descuentoTipo,
        es_tercero: esTercero,
        nombre_tercero: esTercero ? nombreTercero : null,
        sin_iva: sinIva,
      })
      .select().single();

    if (ventaError) { alert("Error al registrar venta"); return; }
    
    if (montoExtra > 0) {
      await supabase.from("detalle_ventas").insert({
        venta_id: venta.id, producto_id: null,
        nombre_producto: descExtra || "Venta rápida",
        precio_unitario: montoExtra, cantidad: 1, subtotal: montoExtra,
      });
    } else {
      const detalles = cart.map(i => ({
        venta_id: venta.id, producto_id: i.id, nombre_producto: i.nombre,
        precio_unitario: i.precio_venta, cantidad: i.qty, subtotal: i.precio_venta * i.qty,
      }));
      await supabase.from("detalle_ventas").insert(detalles);
      for (const item of cart) {
        await supabase.from("productos").update({ existencia: item.existencia - item.qty }).eq("id", item.id);
      }
    }
    
    setSaleCount(n => n + 1);
    setTotalVentas(n => n + totalFinal);
    setCart([]);
    setPayModal(false);
    setShowVentaRapida(false);
    setCashInput(""); setFiadoNombre(""); setVentaRapidaMonto(""); setVentaRapidaDesc("");
    setSuccessMsg(`¡Venta procesada! ${fmt(totalFinal)}`);
    setTimeout(() => setSuccessMsg(""), 2000);
    setDescuentoTipo("ninguno");
    setDescuentoValor("");
    setEsTercero(false);
    setNombreTercero("");
    setSinIva(false);
    setOfertaSeleccionada(null);
    loadProducts();
  };

  const stockBajoCount = products.filter(p => p.existencia <= p.stock_minimo && p.stock_minimo > 0).length;

  // Iconos corregidos y validados para el menú lateral para evitar fallos de React
const navItems = [
    { key: "pos",        icon: I.cart,     label: "Punto de Venta" },
    { key: "ventas",     icon: I.transfer, label: "Historial Ventas" },
    { key: "ofertas",    icon: I.tag,      label: "Ofertas / Combos" },
    { key: "inventario", icon: I.box,      label: "Inventario" },
    { key: "caja",       icon: I.cash,     label: "Caja del Día" },
    { key: "turnos",     icon: I.clock,    label: "Turnos" },
    { key: "servicios",  icon: I.filter,   label: "Servicios Externos" },
    ...(isAdmin ? [
      { key: "usuarios", icon: I.users,    label: "Usuarios" },
    ] : []),
  ];

  return (
    <div style={s.root}>
      {/* MENÚ LATERAL */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🏪</span>
          <div>
            <div style={s.logoName}>JardínBazar</div>
            <div style={s.logoSub}>Eleventa Layout</div>
          </div>
        </div>
        {navItems.map(({ key, icon, label }) => (
          <button key={key} style={{ ...s.navBtn, ...(view === key ? s.navActive : {}) }} onClick={() => setView(key)}>
            <Ico path={icon} size={16} />{label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {stockBajoCount > 0 && (
          <div style={s.stockAlert}>
            <Ico path={I.warn} size={14} /><span>{stockBajoCount} productos bajos</span>
          </div>
        )}
        <div style={s.userBar}>
          <div style={s.userAvatar}>{usuario.nombre[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb" }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase" }}>{usuario.rol}</div>
          </div>
          <button style={s.logoutBtn} onClick={() => { setUsuario(null); setView("pos"); }} title="Salir">
            <Ico path={I.logout} size={14} />
          </button>
        </div>
        <div style={s.statusBar}>
          <span style={{ ...s.dot, background: online ? "#22c55e" : "#ef4444" }} />
          <span style={s.statusTxt}>{online ? "Conectado" : "Sin red"}</span>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={s.main}>
        <header style={s.topbar}>
          <div style={s.topDate}>{fmtDate()}</div>
          <div style={s.topRight}>
            <div style={s.kpi}><span style={s.kpiLabel}>Atendidas</span><span style={s.kpiVal}>{saleCount}</span></div>
            <div style={s.kpi}><span style={s.kpiLabel}>Caja Actual</span><span style={s.kpiVal}>{fmt(totalVentas)}</span></div>
            <span style={s.clock}>{time}</span>
          </div>
        </header>

        {/* MODO PUNTO DE VENTA (ESTILO ELEVENTA) */}
        {view === "pos" && (
          <div style={s.eleventaLayout}>
            {/* Pestañas de múltiples tickets superiores */}
            <div style={s.ticketTabs}>
              {tickets.map((t, idx) => (
                <div key={t.id} style={{ ...s.ticketTab, ...(idx === ticketActivo ? s.ticketTabActive : {}) }}>
                  <button style={s.ticketTabBtn} onClick={() => setTicketActivo(idx)}>
                    📌 {t.nombre} {t.cart.length > 0 && <span style={s.ticketBadge}>{t.cart.reduce((a, b) => a + b.qty, 0)}</span>}
                  </button>
                  {tickets.length > 1 && (
                    <button style={s.ticketClose} onClick={() => cerrarTicket(idx)}>×</button>
                  )}
                </div>
              ))}
              <button style={s.ticketAdd} onClick={agregarTicket}>+ Nuevo [F5]</button>
            </div>

            {/* Barra de ingreso principal de código o nombre */}
            <div style={s.eleventaBar}>
              <div style={{ ...s.searchBox, flex: 1, position: "relative" }}>
                <Ico path={I.search} size={18} />
                <input ref={searchRef} style={s.eleventaInput}
                  placeholder="Ingrese el código de barras o el nombre del producto... [F2]"
                  value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && filteredSearch.length > 0) {
                      addToCart(filteredSearch[0]);
                    }
                  }} autoFocus />
                
                {/* Desplegable interactivo de búsqueda inmediata */}
                {query.length > 0 && (
                  <div style={s.searchResultsDrop}>
                    {filteredSearch.map(p => (
                      <div key={p.id} style={s.dropItem} onClick={() => addToCart(p)}>
                        <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>{fmt(p.precio_venta)}</span>
                      </div>
                    ))}
                    {filteredSearch.length === 0 && <div style={{ padding: 10, color: "#9ca3af", fontSize: 12 }}>No se encontraron coincidencias</div>}
                  </div>
                )}
              </div>
              <button style={s.eleventaZapBtn} onClick={() => setShowVentaRapida(true)}>
                <Ico path={I.zap} size={14} /> Artículo Común [F3]
              </button>
            </div>

            {/* Tabla principal de compras en curso */}
            <div style={s.tableContainer}>
              <table style={s.eleventaTable}>
                <thead>
                  <tr>
                    <th style={{ width: "140px" }}>Código</th>
                    <th>Descripción del Artículo</th>
                    <th style={{ width: "120px", textAlign: "right" }}>Precio Venta</th>
                    <th style={{ width: "140px", textAlign: "center" }}>Cantidad</th>
                    <th style={{ width: "140px", textAlign: "right" }}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id}>
                      <td style={{ color: "#6b7280" }}>{item.codigo || "GENÉRICO"}</td>
                      <td style={{ fontWeight: 600, color: "#111827" }}>{item.nombre}</td>
                      <td style={{ textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{fmt(item.precio_venta)}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", background: "#f3f4f6", borderRadius: 6, border: "1px solid #d1d5db" }}>
                          <button style={s.tableQtyBtn} onClick={() => updateQty(item.id, -1)}><Ico path={item.qty === 1 ? I.trash : I.minus} size={10} /></button>
                          <span style={{ padding: "0 12px", fontWeight: 700, fontSize: 13 }}>{item.qty}</span>
                          <button style={s.tableQtyBtn} onClick={() => updateQty(item.id, 1)}><Ico path={I.plus} size={10} /></button>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: "#111827" }}>{fmt(item.precio_venta * item.qty)}</td>
                    </tr>
                  ))}
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                        <p style={{ fontSize: 15, fontWeight: 600 }}>El ticket de venta está vacío</p>
                        <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Escribe arriba el nombre o pasa un producto por el lector de códigos</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Panel inferior de totales y cobro rápido */}
            <div style={s.eleventaFooter}>
              <div style={{ display: "flex", gap: 16 }}>
                {cart.length > 0 && (
                  <button style={s.clearCartBtn} onClick={() => setCart([])}>
                    <Ico path={I.trash} size={14} /> Vaciar Lista
                  </button>
                )}
              </div>
              <div style={s.eleventaTotalBox}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 700 }}>{cart.reduce((a, b) => a + b.qty, 0)} Artículos en total</span>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#1e3a8a", margin: "4px 0" }}>{fmt(total)}</div>
                </div>
                <button style={{ ...s.eleventaPayBtn, opacity: cart.length === 0 ? 0.5 : 1 }} disabled={cart.length === 0} onClick={() => setPayModal(true)}>
                  <Ico path={I.cash} size={20} /> F4 - Cobrar Recibo
                </button>
              </div>
            </div>
          </div>
        )}

       {view === "inventario" && <Inventario products={products} loadProducts={loadProducts} isAdmin={isAdmin} />}
        {view === "ventas" && <Ventas />}
        {view === "ofertas" && <Ofertas />}
        {view === "caja" && <CierreCaja usuario={usuario} />}
        {view === "turnos" && <Turnos usuario={usuario} />}
        {view === "servicios" && <ServiciosExternos usuario={usuario} isAdmin={isAdmin} />}
        {view === "usuarios" && isAdmin && <Usuarios />}
      </main>

      {/* MODAL COBRO (CON CONEXIÓN CORRECTA) */}
      {payModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setPayModal(false)}>
          <div style={{ ...s.modal, maxWidth: 460 }}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Terminar Venta — {tickets[ticketActivo]?.nombre}</span>
              <button style={s.iconBtn} onClick={() => setPayModal(false)}><Ico path={I.x} size={18} /></button>
            </div>

            <div style={{ background: "#eff6ff", borderRadius: 12, padding: 16, marginBottom: 16, border: "1.5px solid #bfdbfe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1e3a8a" }}>TOTAL A COBRAR:</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#1e3a8a" }}>{fmt(total)}</span>
              </div>
            </div>

            {ofertas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: "#4b5563", fontWeight: 700, display: "block", marginBottom: 6 }}>Promociones Especiales</label>
                <select style={{ ...s.cashField, fontSize: 13, textAlign: "left" }} value={ofertaSeleccionada?.id || ""} onChange={e => {
                  const found = ofertas.find(o => o.id === parseInt(e.target.value));
                  setOfertaSeleccionada(found || null);
                  if (found) { setDescuentoTipo("ninguno"); setDescuentoValor(""); }
                }}>
                  <option value="">Ninguna promoción manual</option>
                  {ofertas.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={s.methods}>
              {[
                { key: "efectivo",      icon: I.cash,     label: "Efectivo" },
                { key: "debito",        icon: I.card,     label: "Débito" },
                { key: "credito",       icon: I.card,     label: "Crédito" },
                { key: "transferencia", icon: I.transfer, label: "Transfer." },
                { key: "fiado",         icon: I.user,     label: "Fiado" },
              ].map(({ key, icon, label }) => (
                <button key={key} style={{ ...s.methodBtn, ...(payMethod === key ? s.methodActive : {}) }} onClick={() => setPayMethod(key)}>
                  <Ico path={icon} size={18} /><span>{label}</span>
                </button>
              ))}
            </div>

            {payMethod === "efectivo" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 6, fontWeight: 600 }}>Paga Con ($)</label>
                <input style={s.cashField} type="number" placeholder="0" value={cashInput} onChange={e => setCashInput(e.target.value)} autoFocus />
                {cashInput && (
                  <div style={s.changeRow}>
                    <span style={{ color: "#4b5563", fontWeight: 600 }}>Su Vuelto:</span>
                    <span style={{ color: change >= 0 ? "#16a34a" : "#ef4444", fontWeight: 900, fontSize: 24 }}>{fmt(Math.max(0, change))}</span>
                  </div>
                )}
              </div>
            )}

            {payMethod === "fiado" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#4b5563", display: "block", marginBottom: 6, fontWeight: 600 }}>Nombre Completo del Cliente</label>
                <input style={s.cashField} type="text" placeholder="¿A quién se le registra la deuda?" value={fiadoNombre} onChange={e => setFiadoNombre(e.target.value)} autoFocus />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={s.cancelBtn} onClick={() => setPayModal(false)}>Cerrar</button>
              <button style={{ ...s.confirmBtn, opacity: (payMethod === "efectivo" && parseFloat(cashInput || 0) < total) || (payMethod === "fiado" && !fiadoNombre) ? 0.4 : 1 }} 
                disabled={(payMethod === "efectivo" && parseFloat(cashInput || 0) < total) || (payMethod === "fiado" && !fiadoNombre)} 
                onClick={() => completeSale()} >
                Registrar Venta Realizada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENTA RÁPIDA / ARTÍCULO COMÚN */}
      {showVentaRapida && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowVentaRapida(false)}>
          <div style={{ ...s.modal, maxWidth: 360 }}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>⚡ Registrar Artículo Común</span>
              <button style={s.iconBtn} onClick={() => setShowVentaRapida(false)}><Ico path={I.x} size={18} /></button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>Descripción Corta</label>
              <input style={{ ...s.cashField, textAlign: "left", fontSize: 14, padding: 10 }} type="text" placeholder="Ej: Bolsa de hielo, abarrotes varios..." value={ventaRapidaDesc} onChange={e => setVentaRapidaDesc(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>Monto Cobro ($)</label>
              <input style={{ ...s.cashField, fontSize: 24, color: "#1e3a8a" }} type="number" placeholder="$0" value={ventaRapidaMonto} onChange={e => setVentaRapidaMonto(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.cancelBtn} onClick={() => setShowVentaRapida(false)}>Volver</button>
              <button style={{ ...s.confirmBtn, opacity: !ventaRapidaMonto || parseFloat(ventaRapidaMonto) <= 0 ? 0.4 : 1 }} 
                disabled={!ventaRapidaMonto || parseFloat(ventaRapidaMonto) <= 0} 
                onClick={() => completeSale(parseFloat(ventaRapidaMonto), ventaRapidaDesc)}>
                Cobrar Al Instante
              </button>
            </div>
          </div>
        </div>
      )}

      {successMsg && <div style={s.successFlash}>✔️ <span>{successMsg}</span></div>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f3f4f6; font-family: 'Inter', sans-serif; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.1s ease; }
        input, select { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}

const s = {
  root: { display: "flex", height: "100vh", background: "#f1f5f9" },
  sidebar: { width: 230, background: "#0f172a", display: "flex", flexDirection: "column", padding: 12 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 20px" },
  logoIcon: { fontSize: 22 },
  logoName: { color: "#fff", fontWeight: 900, fontSize: 15, letterSpacing: "-0.3px" },
  logoSub: { color: "#64748b", fontSize: 11 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", background: "none", border: "none", borderRadius: 8, color: "#94a3b8", fontSize: 13, fontWeight: 600, textAlign: "left" },
  navActive: { background: "#1e293b", color: "#fff" },
  stockAlert: { display: "flex", alignItems: "center", gap: 6, background: "#450a0a", color: "#fca5a5", padding: "8px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, marginBottom: 10 },
  userBar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderTop: "1px solid #1e293b" },
  userAvatar: { width: 28, height: 28, background: "#334155", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 },
  logoutBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer" },
  statusBar: { display: "flex", alignItems: "center", gap: 6, paddingTop: 10, borderTop: "1px solid #1e293b" },
  dot: { width: 6, height: 6, borderRadius: "50%" },
  statusTxt: { color: "#64748b", fontSize: 10 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { height: 56, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" },
  topDate: { fontSize: 13, fontWeight: 600, color: "#475569" },
  topRight: { display: "flex", alignItems: "center", gap: 20 },
  kpi: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  kpiLabel: { fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 },
  kpiVal: { fontSize: 14, fontWeight: 800, color: "#0f172a" },
  clock: { fontSize: 14, fontWeight: 700, color: "#334155", background: "#f1f5f9", padding: "4px 10px", borderRadius: 6 },
  
  // ESTILO ELEVENTA
  eleventaLayout: { flex: 1, display: "flex", flexDirection: "column", background: "#fff", padding: "0 16px 16px" },
  ticketTabs: { display: "flex", gap: 2, background: "#f8fafc", padding: "6px 6px 0", margin: "0 -16px 12px", borderBottom: "1px solid #e2e8f0" },
  ticketTab: { display: "flex", alignItems: "center", background: "#e2e8f0", borderRadius: "6px 6px 0 0", overflow: "hidden", border: "1px solid #cbd5e1", borderBottom: "none" },
  ticketTabActive: { background: "#fff", borderColor: "#cbd5e1", position: "relative", zIndex: 2 },
  ticketTabBtn: { background: "none", border: "none", padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#334155" },
  ticketBadge: { background: "#1e40af", color: "#fff", padding: "1px 5px", borderRadius: 8, fontSize: 9, marginLeft: 4 },
  ticketClose: { background: "none", border: "none", paddingRight: 10, fontSize: 14, color: "#94a3b8" },
  ticketAdd: { background: "none", border: "none", padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#16a34a" },
  eleventaBar: { display: "flex", gap: 12, marginBottom: 12 },
  searchBox: { display: "flex", alignItems: "center", background: "#fff", border: "2px solid #3b82f6", borderRadius: 6, padding: "0 12px", gap: 10 },
  eleventaInput: { border: "none", outline: "none", width: "100%", fontSize: 15, height: 44, fontWeight: 600, color: "#1e293b" },
  searchResultsDrop: { position: "absolute", top: "100%", left: -2, right: -2, background: "#fff", border: "1px solid #cbd5e1", borderRadius: "0 0 6px 6px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: 200, overflowY: "auto" },
  dropItem: { display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: 13 },
  eleventaZapBtn: { display: "flex", alignItems: "center", gap: 6, padding: "0 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#334155" },
  tableContainer: { flex: 1, border: "1px solid #cbd5e1", borderRadius: 6, overflowY: "auto", background: "#fff" },
  eleventaTable: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  eleventaTableTh: { background: "#f1f5f9", color: "#475569", fontWeight: 700, padding: 10, textAlign: "left", borderBottom: "2px solid #cbd5e1" },
  tableQtyBtn: { background: "none", border: "none", padding: "6px 10px", color: "#64748b" },
  eleventaFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" },
  clearCartBtn: { background: "none", border: "1px solid #fca5a5", color: "#dc2626", padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 },
  eleventaTotalBox: { display: "flex", alignItems: "center", gap: 24 },
  eleventaPayBtn: { padding: "12px 28px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 6px -1px rgba(22,163,74,0.2)" },
  
  // MODALES
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: 12, width: "100%", padding: 20, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  iconBtn: { background: "none", border: "none", color: "#94a3b8" },
  methods: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 16 },
  methodBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: "#475569", fontSize: 11, fontWeight: 700 },
  methodActive: { borderColor: "#2563eb", background: "#eff6ff", color: "#2563eb" },
  cashField: { width: "100%", border: "1px solid #cbd5e1", borderRadius: 6, padding: "10px", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none", background: "#f8fafc" },
  changeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: "#f0fdf4", padding: "8px 12px", borderRadius: 6 },
  cancelBtn: { flex: 1, padding: 11, background: "none", border: "1px solid #cbd5e1", borderRadius: 6, color: "#475569", fontSize: 12, fontWeight: 600 },
  confirmBtn: { flex: 1, padding: 11, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  successFlash: { position: "fixed", bottom: 20, right: 20, background: "#0f172a", color: "#fff", padding: "12px 20px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, zIndex: 200 }
};

// Inyección de estilos de tabla dinámicos necesarios
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .eleventaTable th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 12px; border-bottom: 2px solid #cbd5e1; text-align: left; }
    .eleventaTable td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .eleventaTable tr:hover { background: #f8fafc; }
  `;
  document.head.appendChild(style);
}
