// JARDINBAZAR POS v6 — Modular
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

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);
const fmtTime = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
const fmtDate = () => new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });

const Ico = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
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
  const [editProduct, setEditProduct] = useState(null);
  const [filterStockBajo, setFilterStockBajo] = useState(false);
  const [showVentaRapida, setShowVentaRapida] = useState(false);
  const [ventaRapidaMonto, setVentaRapidaMonto] = useState("");
  const [ventaRapidaDesc, setVentaRapidaDesc] = useState("");
  const [fiadoNombre, setFiadoNombre] = useState("");
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
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
  }, [loadProducts, loadOfertas, cart, usuario]);

  useEffect(() => {
    if (!usuario) return;
    const channel = supabase.channel("productos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, () => loadProducts())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadProducts, usuario]);

  if (!usuario) return <Login onLogin={(u) => { setUsuario(u); setView("pos"); }} />;

  const filtered = products.filter(p => {
    const matchQuery = query.length === 0 ||
      p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
      p.codigo?.toString().includes(query) ||
      p.departamento?.toLowerCase().includes(query.toLowerCase());
    const matchStock = !filterStockBajo || (p.existencia <= p.stock_minimo && p.stock_minimo > 0);
    return matchQuery && matchStock;
  });

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
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const totalBruto = cart.reduce((s, i) => s + i.precio_venta * i.qty, 0);
  
  const calcularDescuento = () => {
    if (ofertaSeleccionada) {
      if (ofertaSeleccionada.tipo === "porcentaje") return Math.round(totalBruto * ofertaSeleccionada.valor / 100);
      if (ofertaSeleccionada.tipo === "monto_fijo") return ofertaSeleccionada.valor;
      if (ofertaSeleccionada.tipo === "2x1") {
        if (cart.length >= 2) {
          const sorted = [...cart].sort((a, b) => a.precio_venta - b.precio_venta);
          return sorted[0].precio_venta;
        }
      }
      if (ofertaSeleccionada.tipo === "combo") return Math.max(0, totalBruto - ofertaSeleccionada.valor);
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
        nombre_producto: descExtra || "Venta rápida sin código",
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
    setPayModal(false); setShowVentaRapida(false);
    setCashInput(""); setFiadoNombre(""); setVentaRapidaMonto(""); setVentaRapidaDesc("");
    setSuccessMsg(`¡Venta registrada! ${fmt(totalFinal)}`);
    setTimeout(() => setSuccessMsg(""), 2500);
    setDescuentoTipo("ninguno");
    setDescuentoValor("");
    setEsTercero(false);
    setNombreTercero("");
    setSinIva(false);
    setOfertaSeleccionada(null);
    loadProducts();
  };

  const stockBajoCount = products.filter(p => p.existencia <= p.stock_minimo && p.stock_minimo > 0).length;

  const navItems = [
    { key: "pos",        icon: I.cart,     label: "Punto de Venta" },
    { key: "ventas",     icon: I.list,     label: "Ventas" },
    { key: "ofertas",    icon: I.tag,      label: "Ofertas" },
    { key: "inventario", icon: I.box,      label: "Inventario" },
    { key: "caja",       icon: I.cash,     label: "Caja del Día" },
    { key: "turnos",     icon: I.clock,    label: "Turnos" },
    ...(isAdmin ? [
      { key: "reportes", icon: I.chart,    label: "Reportes" },
      { key: "usuarios", icon: I.users,    label: "Usuarios" },
    ] : []),
  ];

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🏪</span>
          <div>
            <div style={s.logoName}>JardínBazar</div>
            <div style={s.logoSub}>Sistema POS</div>
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
            <Ico path={I.warn} size={14} /><span>{stockBajoCount} con stock bajo</span>
          </div>
        )}
        <div style={s.userBar}>
          <div style={s.userAvatar}>{usuario.nombre[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase" }}>{usuario.rol}</div>
          </div>
          <button style={s.logoutBtn}
            onClick={() => { setUsuario(null); setTickets([{ id: 1, nombre: "Ticket 1", cart: [] }]); setTicketActivo(0); setView("pos"); }}
            title="Cerrar sesión">
            <Ico path={I.logout} size={14} />
          </button>
        </div>
        <div style={s.statusBar}>
          <span style={{ ...s.dot, background: online ? "#22c55e" : "#ef4444" }} />
          <span style={s.statusTxt}>{online ? "En línea" : "Sin conexión"}</span>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <div style={s.topDate()}–{fmtDate()}</div>
          <div style={s.topRight}>
            <div style={s.kpi}><span style={s.kpiLabel}>Ventas hoy</span><span style={s.kpiVal}>{saleCount}</span></div>
            <div style={s.kpi}><span style={s.kpiLabel}>Total hoy</span><span style={s.kpiVal}>{fmt(totalVentas)}</span></div>
            <span style={s.clock}>{time}</span>
          </div>
        </header>

        {/* ── POS ── */}
        {view === "pos" && (
          <div style={s.posLayout}>
            <section style={s.prodPanel}>
              <div style={s.ticketTabs}>
                {tickets.map((t, idx) => (
                  <div key={t.id} style={{ ...s.ticketTab, ...(idx === ticketActivo ? s.ticketTabActive : {}) }}>
                    <button style={s.ticketTabBtn} onClick={() => setTicketActivo(idx)}>
                      {t.nombre} {t.cart.length > 0 && <span style={s.ticketBadge}>{t.cart.length}</span>}
                    </button>
                    {tickets.length > 1 && (
                      <button style={s.ticketClose} onClick={() => cerrarTicket(idx)}>×</button>
                    )}
                  </div>
                ))}
                <button style={s.ticketAdd} onClick={agregarTicket} title="Nuevo ticket [F5]">+ [F5]</button>
              </div>

              <div style={s.posToolbar}>
                <div style={{ ...s.searchBox, flex: 1 }}>
                  <Ico path={I.search} size={16} />
                  <input ref={searchRef} style={s.searchInput}
                    placeholder="Buscar por nombre, código o departamento… [F2]"
                    value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && filtered.length === 1) addToCart(filtered[0]);
                      if (e.key === "Tab" && filtered.length > 0) { e.preventDefault(); addToCart(filtered[0]); }
                    }} autoFocus />
                  {query && <button style={s.clearBtn} onClick={() => { setQuery(""); searchRef.current?.focus(); }}><Ico path={I.x} size={14} /></button>}
                </div>
                <button style={{ ...s.toolBtn, background: filterStockBajo ? "#fef3c7" : "#fff", borderColor: filterStockBajo ? "#d97706" : "#e5e7eb", color: filterStockBajo ? "#d97706" : "#374151" }}
                  onClick={() => setFilterStockBajo(!filterStockBajo)}>
                  <Ico path={I.filter} size={14} />Stock bajo {stockBajoCount > 0 && `(${stockBajoCount})`}
                </button>
                <button style={{ ...s.toolBtn, background: "#f0fdf4", borderColor: "#16a34a", color: "#16a34a" }}
                  onClick={() => setShowVentaRapida(true)}>
                  <Ico path={I.zap} size={14} />Venta rápida [F3]
                </button>
              </div>

              {loading ? <div style={s.center}>Cargando productos...</div> : (
                <div style={s.grid}>
                  {filtered.slice(0, 60).map(p => (
                    <button key={p.id} style={{ ...s.card, opacity: p.existencia <= 0 ? 0.4 : 1 }}
                      onClick={() => addToCart(p)} disabled={p.existencia <= 0}>
                      {p.existencia <= 0 && <span style={s.agotado}>Agotado</span>}
                      {p.existencia > 0 && p.existencia <= p.stock_minimo && p.stock_minimo > 0 && (
                        <span style={s.lowStock}><Ico path={I.warn} size={9} /> Stock bajo</span>
                      )}
                      <div style={s.cardDept}>{p.departamento || "General"}</div>
                      <div style={s.cardName}>{p.nombre}</div>
                      <div style={s.cardFooter}>
                        <span style={s.cardPrice}>{fmt(p.precio_venta)}</span>
                        <span style={{ ...s.cardStock, color: p.existencia <= 0 ? "#ef4444" : p.existencia <= 5 ? "#f59e0b" : "#6b7280" }}>{p.existencia} uds</span>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && <div style={s.empty}><Ico path={I.search} size={32} /><p>{filterStockBajo ? "No hay productos con stock bajo" : `Sin resultados para "${query}"`}</p></div>}
                  {filtered.length > 60 && <div style={{ ...s.empty, fontSize: 12, color: "#9ca3af" }}>Mostrando 60 de {filtered.length} — refina la búsqueda</div>}
                </div>
              )}
            </section>

            <section style={s.cartPanel}>
              <div style={s.cartHeader}>
                <Ico path={I.cart} size={16} />
                <span style={{ fontWeight: 700 }}>{tickets[ticketActivo]?.nombre}</span>
                {cart.length > 0 && <button style={s.clearCart} onClick={() => setCart([])}>Limpiar</button>}
              </div>
              <div style={s.cartItems}>
                {cart.length === 0 && (
                  <div style={s.emptyCart}>
                    <Ico path={I.cart} size={36} />
                    <p>Escanea o selecciona productos</p>
                    <p style={{ fontSize: 11, color: "#d1d5db" }}>F3 venta rápida · F5 nuevo ticket</p>
                  </div>
                )}
                {cart.map(item => (
                  <div key={item.id} style={s.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.cartName}>{item.nombre}</div>
                      <div style={s.cartSub}>{fmt(item.precio_venta)} c/u</div>
                    </div>
                    <div style={s.qtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}><Ico path={item.qty === 1 ? I.trash : I.minus} size={12} /></button>
                      <span style={s.qtyNum}>{item.qty}</span>
                      <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}><Ico path={I.plus} size={12} /></button>
                    </div>
                    <div style={s.cartTotal}>{fmt(item.precio_venta * item.qty)}</div>
                  </div>
                ))}
              </div>
              <div style={s.totals}>
                <div style={s.totalRow}><span style={{ color: "#6b7280" }}>Subtotal</span><span>{fmt(totalBruto)}</span></div>
                {isAdmin && cart.length > 0 && (
                  <div style={s.totalRow}>
                    <span style={{ color: "#9ca3af", fontSize: 11 }}>Utilidad aprox.</span>
                    <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 700 }}>{fmt(cart.reduce((s, i) => s + (i.precio_venta - i.precio_costo) * i.qty, 0))}</span>
                  </div>
                )}
                <div style={s.totalBig}><span>TOTAL</span><span>{fmt(total)}</span></div>
              </div>
              <button style={{ ...s.payBtn, opacity: cart.length === 0 ? 0.4 : 1 }} disabled={cart.length === 0} onClick={() => setPayModal(true)}>
                <Ico path={I.cash} size={18} /> Cobrar [F4]
              </button>
            </section>
          </div>
        )}

        {/* ── INVENTARIO (componente externo) ── */}
        {view === "inventario" && (
          <Inventario products={products} loadProducts={loadProducts} isAdmin={isAdmin} />
        )}

        {view === "caja" && <CierreCaja usuario={usuario} />}
        {view === "turnos" && <Turnos usuario={usuario} />}
        {view === "reportes" && isAdmin && (
          <div style={s.cajaWrap}>
            <div style={s.cajaNote}><Ico path={I.chart} size={16} /><span>Reportes con gráficos disponibles en Etapa 8.</span></div>
          </div>
        )}
        {view === "usuarios" && isAdmin && <Usuarios />}
      </main>

      {/* ── MODAL COBRO NUEVO (CON DESCUENTOS Y OFERTAS) ── */}
      {payModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setPayModal(false)}>
          <div style={{ ...s.modal, maxWidth: 460 }}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Cobrar — {tickets[ticketActivo]?.nombre}</span>
              <button style={s.iconBtn} onClick={() => setPayModal(false)}><Ico path={I.x} size={18} /></button>
            </div>

            {/* Resumen de Totales */}
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16, marginBottom: 16, border: "1.5px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14 }}>
                <span style={{ color: "#6b7280" }}>Total Bruto:</span>
                <span style={{ fontWeight: 600 }}>{fmt(totalBruto)}</span>
              </div>
              {descuentoAplicado > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "#dc2626" }}>
                  <span>Descuento aplicado:</span>
                  <span style={{ fontWeight: 600 }}>- {fmt(descuentoAplicado)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px dashed #e5e7eb" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>TOTAL A PAGAR:</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#16a34a" }}>{fmt(total)}</span>
              </div>
            </div>

            {/* Sección de Ofertas Flexibles Disponibles */}
            {ofertas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>Aplicar Oferta Activa</label>
                <select 
                  style={{ ...s.cashField, fontSize: 14, textAlign: "left" }} 
                  value={ofertaSeleccionada?.id || ""} 
                  onChange={e => {
                    const found = ofertas.find(o => o.id === parseInt(e.target.value));
                    setOfertaSeleccionada(found || null);
                    if (found) { setDescuentoTipo("ninguno"); setDescuentoValor(""); }
                  }}
                >
                  <option value="">-- Ninguna oferta seleccionada --</option>
                  {ofertas.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre} ({o.tipo === 'porcentaje' ? `${o.valor}%` : o.tipo === 'monto_fijo' ? fmt(o.valor) : o.tipo})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Descuentos Manuales (Solo si no hay oferta seleccionada) */}
            {!ofertaSeleccionada && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Tipo Desc.</label>
                  <select style={{ ...s.cashField, fontSize: 14, padding: "9px 10px" }} value={descuentoTipo} onChange={e => { setDescuentoTipo(e.target.value); setDescuentoValor(""); }}>
                    <option value="ninguno">Ninguno</option>
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto_fijo">Monto Fijo ($)</option>
                  </select>
                </div>
                {descuentoTipo !== "ninguno" && (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Valor Descuento</label>
                    <input style={{ ...s.cashField, fontSize: 14, padding: "9px 10px" }} type="number" placeholder="0" value={descuentoValor} onChange={e => setDescuentoValor(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {/* Opciones Adicionales (Sin IVA / Terceros) */}
            <div style={{ background: "#f3f4f6", borderRadius: 10, padding: 12, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input type="checkbox" checked={sinIva} onChange={e => setSinIva(e.target.checked)} />
                <span>Venta sin IVA (Exenta / Boleta manual)</span>
              </label>
              
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input type="checkbox" checked={esTercero} onChange={e => { setEsTercero(e.target.checked); if(!e.target.checked) setNombreTercero(""); }} />
                <span>Esta venta pertenece a un tercero (Proveedor externo)</span>
              </label>

              {esTercero && (
                <input style={{ ...s.cashField, fontSize: 13, padding: "6px 12px", textAlign: "left" }} type="text" placeholder="Nombre del proveedor o tercero" value={nombreTercero} onChange={e => setNombreTercero(e.target.value)} />
              )}
            </div>

            {/* Métodos de Pago */}
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

            {/* Campos Dinámicos por Método */}
            {payMethod === "efectivo" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Efectivo recibido</label>
                <input style={s.cashField} type="number" placeholder="0" value={cashInput} onChange={e => setCashInput(e.target.value)} autoFocus />
                {cashInput && <div style={s.changeRow}><span style={{ color: "#6b7280" }}>Vuelto:</span><span style={{ color: change >= 0 ? "#16a34a" : "#ef4444", fontWeight: 800, fontSize: 22 }}>{fmt(Math.max(0, change))}</span></div>}
              </div>
            )}
            {payMethod === "fiado" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Nombre del cliente</label>
                <input style={s.cashField} type="text" placeholder="Nombre de quien fía" value={fiadoNombre} onChange={e => setFiadoNombre(e.target.value)} autoFocus />
              </div>
            )}

            {/* Botones de Acción */}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button style={s.cancelBtn} onClick={() => setPayModal(false)}>Cancelar</button>
              <button 
                style={{ ...s.confirmBtn, opacity: (payMethod === "efectivo" && parseFloat(cashInput || 0) < total) || (payMethod === "fiado" && !fiadoNombre) || (esTercero && !nombreTercero) ? 0.4 : 1 }}
                disabled={(payMethod === "efectivo" && parseFloat(cashInput || 0) < total) || (payMethod === "fiado" && !fiadoNombre) || (esTercero && !nombreTercero)}
                onClick={() => completeSale()}
              >
                <Ico path={I.check} size={18} /> Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VENTA RÁPIDA ── */}
      {showVentaRapida && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowVentaRapida(false)}>
          <div style={{ ...s.modal, maxWidth: 340 }}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>⚡ Venta rápida sin código</span>
              <button style={s.iconBtn} onClick={() => setShowVentaRapida(false)}><Ico path={I.x} size={18} /></button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>Descripción (opcional)</label>
              <input style={s.cashField} type="text" placeholder="Ej: Producto sin código..." value={ventaRapidaDesc} onChange={e => setVentaRapidaDesc(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>Monto ($)</label>
              <input style={{ ...s.cashField, fontSize: 28 }} type="number" placeholder="0" value={ventaRapidaMonto} onChange={e => setVentaRapidaMonto(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.cancelBtn} onClick={() => setShowVentaRapida(false)}>Cancelar</button>
              <button style={{ ...s.confirmBtn, opacity: !ventaRapidaMonto || parseFloat(ventaRapidaMonto) <= 0 ? 0.4 : 1 }}
                disabled={!ventaRapidaMonto || parseFloat(ventaRapidaMonto) <= 0}
                onClick={() => completeSale(parseFloat(ventaRapidaMonto), ventaRapidaDesc)}>
                <Ico path={I.check} size={18} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <AddProduct
          productToEdit={editProduct}
          isDuplicate={isDuplicateMode}
          onClose={() => { setShowAddProduct(false); setEditProduct(null); setIsDuplicateMode(false); }}
          onSaved={loadProducts}
        />
      )}

      {successMsg && <div style={s.successFlash}><Ico path={I.check} size={28} /><span>{successMsg}</span></div>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f3f4f6; font-family: 'Inter', sans-serif; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      `}</style>
    </div>
  );
}

const s = {
  root: { display: "flex", height: "100vh", background: "#f3f4f6" },
  sidebar: { width: 240, background: "#111827", display: "flex", flexDirection: "column", padding: 16 },
  logo: { display: "flex", alignItems: "center", gap: 12, padding: "8px 12px 24px" },
  logoIcon: { fontSize: 24 },
  logoName: { color: "#fff", fontWeight: 800, fontSize: 16 },
  logoSub: { color: "#9ca3af", fontSize: 11 },
  navBtn: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", background: "none", border: "none", borderRadius: 8, color: "#9ca3af", fontSize: 13, fontWeight: 600, textAlign: "left", transition: "all .15s" },
  navActive: { background: "#1f2937", color: "#fff" },
  stockAlert: { display: "flex", alignItems: "center", gap: 8, background: "#7f1d1d", color: "#fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12 },
  userBar: { display: "flex", alignItems: "center", gap: 12, padding: "12px 8px", borderTop: "1px solid #1f2937" },
  userAvatar: { width: 32, height: 32, background: "#374151", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  logoutBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 4 },
  statusBar: { display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid #1f2937" },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  statusTxt: { color: "#9ca3af", fontSize: 11 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { height: 64, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 },
  topDate: { fontSize: 14, fontWeight: 600, color: "#374151", textTransform: "capitalize" },
  topRight: { display: "flex", alignItems: "center", gap: 24 },
  kpi: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  kpiLabel: { fontSize: 10, color: "#6b7280", textTransform: "uppercase", fontWeight: 600 },
  kpiVal: { fontSize: 15, fontWeight: 800, color: "#111827" },
  clock: { fontSize: 16, fontWeight: 700, color: "#111827", background: "#f3f4f6", padding: "6px 12px", borderRadius: 8, fontFamily: "monospace" },
  posLayout: { flex: 1, display: "flex", overflow: "hidden" },
  prodPanel: { flex: 1, display: "flex", flexDirection: "column", padding: 20, overflow: "hidden" },
  ticketTabs: { display: "flex", gap: 6, marginBottom: 14, borderBottom: "2px solid #e5e7eb", paddingBottom: 1 },
  ticketTab: { display: "flex", alignItems: "center", background: "#e5e7eb", borderRadius: "8px 8px 0 0", overflow: "hidden" },
  ticketTabActive: { background: "#fff", border: "2px solid #e5e7eb", borderBottom: "none", transform: "translateY(2px)" },
  ticketTabBtn: { background: "none", border: "none", padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "#4b5563" },
  ticketBadge: { background: "#16a34a", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10, marginLeft: 6 },
  ticketClose: { background: "none", border: "none", paddingRight: 10, fontSize: 16, color: "#9ca3af", cursor: "pointer" },
  ticketAdd: { background: "#f3f4f6", border: "1px dashed #cbd5e1", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#64748b" },
  posToolbar: { display: "flex", gap: 12, marginBottom: 16 },
  searchBox: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 14px", height: 42 },
  searchInput: { border: "none", outline: "none", width: "100%", fontSize: 14, color: "#111827" },
  clearBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer" },
  toolBtn: { display: "flex", alignItems: "center", gap: 8, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 14px", height: 42, fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer" },
  grid: { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, overflowY: "auto", alignContent: "start" },
  card: { position: "relative", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", transition: "all .15s" },
  agotado: { position: "absolute", inset: 0, background: "#ffffffaa", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontWeight: 800, fontSize: 14, borderRadius: 12 },
  lowStock: { position: "absolute", top: 6, right: 6, background: "#fef3c7", color: "#d97706", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 },
  cardDept: { fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 },
  cardName: { fontSize: 13, fontWeight: 600, color: "#111827", height: 38, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  cardFooter: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px dashed #f3f4f6" },
  cardPrice: { fontSize: 14, fontWeight: 800, color: "#16a34a" },
  cardStock: { fontSize: 11, fontWeight: 500 },
  empty: { gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "#9ca3af", gap: 12 },
  center: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" },
  cartPanel: { width: 340, background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column" },
  cartHeader: { display: "flex", alignItems: "center", gap: 10, padding: "18px 20px", borderBottom: "1px solid #e5e7eb" },
  clearCart: { marginLeft: "auto", background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 600 },
  cartItems: { flex: 1, overflowY: "auto", padding: "10px 20px" },
  emptyCart: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 10, textAlign: "center" },
  cartItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  cartName: { fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cartSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  qtyCtrl: { display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", padding: 4, borderRadius: 6 },
  qtyBtn: { width: 22, height: 22, borderRadius: 4, border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", boxShadow: "0 1px 3px #0001" },
  qtyNum: { fontSize: 13, fontWeight: 700, color: "#111827", minWidth: 16, textAlign: "center" },
  cartTotal: { fontSize: 13, fontWeight: 700, color: "#111827", marginLeft: "auto" },
  totals: { padding: 20, background: "#f9fafb", borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 8 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 13 },
  totalBig: { display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 4, paddingTop: 8, borderTop: "1px solid #e5e7eb" },
  payBtn: { margin: "0 20px 20px", padding: 14, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 12px #16a34a44" },
  overlay: { position: "fixed", inset: 0, background: "#00000077", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 },
  modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 20px 60px #0004" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  iconBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer" },
  modalTotal: { fontSize: 42, fontWeight: 800, color: "#16a34a", textAlign: "center" },
  methods: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 },
  methodBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#f9fafb", color: "#4b5563", fontSize: 11, fontWeight: 600 },
  methodActive: { borderColor: "#16a34a", background: "#f0fdf4", color: "#16a34a" },
  cashField: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none", background: "#f9fafb" },
  changeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, background: "#f0fdf4", padding: "8px 14px", borderRadius: 8 },
  cancelBtn: { flex: 1, padding: 12, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#4b5563", fontSize: 13, fontWeight: 600 },
  confirmBtn: { flex: 1, padding: 12, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  successFlash: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", padding: "14px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 10px 30px #0003", zIndex: 400 },
  cajaWrap: { padding: 24 },
  cajaNote: { display: "flex", alignItems: "center", gap: 10, background: "#eff6ff", border: "1.5px solid #bfdbfe", padding: 16, borderRadius: 10, color: "#1e40af", fontSize: 13, fontWeight: 500 },
};
