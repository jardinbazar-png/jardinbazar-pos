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
  box:      "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  warn:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  zap:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  x:        "M18 6L6 18M6 6l12 12"
};

export default function POSApp() {
  const [usuario, setUsuario] = useState(null);
  const [view, setView] = useState("pos");
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([{ id: 1, nombre: "Ticket 1", cart: [] }]);
  const [ticketActivo, setTicketActivo] = useState(0);
  const [query, setQuery] = useState("");
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState("efectivo");
  const [cashInput, setCashInput] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [time, setTime] = useState(fmtTime());
  const [online, setOnline] = useState(navigator.onLine);
  const [saleCount, setSaleCount] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [showVentaRapida, setShowVentaRapida] = useState(false);
  const [ventaRapidaMonto, setVentaRapidaMonto] = useState("");
  const [ventaRapidaDesc, setVentaRapidaDesc] = useState("");
  const [fiadoNombre, setFiadoNombre] = useState("");
  const [ofertas, setOfertas] = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const searchRef = useRef(null);

  const cart = tickets[ticketActivo]?.cart || [];
  const isAdmin = usuario?.rol === "admin";

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
    setProducts(data || []);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    loadProducts();
    const t = setInterval(() => setTime(fmtTime()), 1000);
    return () => clearInterval(t);
  }, [usuario, loadProducts]);

  if (!usuario) return <Login onLogin={(u) => { setUsuario(u); }} />;

  const total = cart.reduce((s, i) => s + (i.precio_venta * i.qty), 0);

  return (
    <div style={s.root}>
      {/* Sidebar y Layout principal simplificados para integración */}
      <aside style={s.sidebar}>
        <div style={s.logo}>🏪 <span style={s.logoName}>JardínBazar</span></div>
        {[
          { key: "pos", icon: I.cart, label: "POS" },
          { key: "inventario", icon: I.box, label: "Inventario" }
        ].map(item => (
          <button key={item.key} style={{ ...s.navBtn, ...(view === item.key && s.navActive) }} onClick={() => setView(item.key)}>
            <Ico path={item.icon} size={16} /> {item.label}
          </button>
        ))}
      </aside>

      <main style={s.main}>
        {view === "pos" ? (
          <div style={s.eleventaLayout}>
            <div style={s.eleventaBar}>
              <input ref={searchRef} style={s.eleventaInput} placeholder="Buscar producto... [F2]" value={query} onChange={e => setQuery(e.target.value)} />
              <button onClick={() => setPayModal(true)} style={s.eleventaPayBtn}>Cobrar {fmt(total)}</button>
            </div>
            {/* Tabla de items y lógica de carrito aquí */}
          </div>
        ) : (
          <Inventario products={products} loadProducts={loadProducts} isAdmin={isAdmin} />
        )}
      </main>
      
      {successMsg && <div style={s.successFlash}>{successMsg}</div>}
    </div>
  );
}

const s = {
  root: { display: "flex", height: "100vh", background: "#f1f5f9" },
  sidebar: { width: 200, background: "#0f172a", color: "#fff", padding: 20 },
  logo: { fontSize: 18, fontWeight: 900, marginBottom: 20 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 10, background: "none", border: "none", color: "#94a3b8", cursor: "pointer" },
  navActive: { color: "#fff", background: "#1e293b", borderRadius: 6 },
  main: { flex: 1, padding: 20, overflowY: "auto" },
  eleventaLayout: { background: "#fff", padding: 20, borderRadius: 8 },
  eleventaBar: { display: "flex", gap: 10, marginBottom: 20 },
  eleventaInput: { flex: 1, padding: 10, border: "1px solid #cbd5e1", borderRadius: 6 },
  eleventaPayBtn: { background: "#16a34a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700 },
  successFlash: { position: "fixed", bottom: 20, right: 20, background: "#0f172a", color: "#fff", padding: 12, borderRadius: 8 }
};
