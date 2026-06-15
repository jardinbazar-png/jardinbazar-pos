// JARDINBAZAR POS v5 — Turnos, multiticket y duplicar productos
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import AddProduct from "./AddProduct.jsx";
import Login from "./Login.jsx";
import Usuarios from "./Usuarios.jsx";
import CierreCaja from "./CierreCaja.jsx";
import Turnos from "./Turnos.jsx";

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
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  cart: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  trash: "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  cash: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  card: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 13h.01",
  transfer: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  chart: "M18 20V10M12 20V4M6 20v-6",
  warn: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
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
  }, [loadProducts, cart, usuario]);

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

  const total = cart.reduce((s, i) => s + i.precio_venta * i.qty, 0);
  const change = parseFloat(cashInput || 0) - total;

  const completeSale = async (montoExtra = 0, descExtra = "") => {
    const totalFinal = montoExtra > 0 ? montoExtra : total;
    if (totalFinal <= 0) return;
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert({ total: totalFinal, metodo_pago: payMethod + (fiadoNombre ? `_fiado:${fiadoNombre}` : "") })
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
    loadProducts();
  };

  const stockBajoCount = products.filter(p => p.existencia <= p.stock_minimo && p.stock_minimo > 0).length;

  const navItems = [
    { key: "pos", icon: I.cart, label: "Punto de Venta" },
    { key: "inventario", icon: I.box, label: "Inventario" },
    { key: "caja", icon: I.cash, label: "Caja del Día" },
    { key: "turnos", icon: I.clock, label: "Turnos" },
    ...(isAdmin ? [
      { key: "reportes", icon: I.chart, label: "Reportes" },
      { key: "usuarios", icon: I.users, label: "Usuarios" },
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
        {stockBajoCount > 0 && <div style={s.stockAlert}><Ico path={I.warn} size={14} /><span>{stockBajoCount} con stock bajo</span></div>}
        <div style={s.userBar}>
          <div style={s.userAvatar}>{usuario.nombre[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f9fafb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase" }}>{usuario.rol}</div>
          </div>
          <button style={s.logoutBtn} onClick={() => { setUsuario(null); setTickets([{ id: 1, nombre: "Ticket 1", cart: [] }]); setTicketActivo(0); setView("pos"); }} title="Cerrar sesión">
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
          <div style={s.topDate}>{fmtDate()}</div>
          <div style={s.topRight}>
            <div style={s.kpi}><span style={s.kpiLabel}>Ventas hoy</span><span style={s.kpiVal}>{saleCount}</span></div>
            <div style={s.kpi}><span style={s.kpiLabel}>Total hoy</span><span style={s.kpiVal}>{fmt(totalVentas)}</span></div>
            <span style={s.clock}>{time}</span>
          </div>
        </header>

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
                  {filtered.length === 0 && <div style={s.empty}><Ico path={I
