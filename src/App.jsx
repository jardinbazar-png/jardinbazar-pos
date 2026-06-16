// JARDINBAZAR POS v6 — Modular (Corregido)
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
const fmtDate = () => {
  const d = new Date();
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
};

export default function App() {
  const [view, setView] = useState("pos");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [payModal, setPayModal] = useState(false);
  const [efectivo, setEfectivo] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [online, setOnline] = useState(navigator.onLine);
  const [time, setTime] = useState(fmtTime());
  const [usuario, setUsuario] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showVentaRapida, setShowVentaRapida] = useState(false);

  const searchRef = useRef(null);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("productos").select("*").order("name");
    if (data) setProducts(data);
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

  // Aquí nos aseguramos de que maneje bien el estado al loguearse
  const handleLoginSuccess = (user) => {
    setUsuario(user);
  };

  const logout = () => {
    setUsuario(null);
    setView("pos");
  };

  const addToCart = (p) => {
    if (p.stock <= 0) return;
    const exist = cart.find((i) => i.code === p.code);
    if (exist) {
      if (exist.qty >= p.stock) return;
      setCart(cart.map((i) => (i.code === p.code ? { ...i, qty: i.qty + 1 } : i)));
    } else {
      setCart([...cart, { ...p, qty: 1 }]);
    }
    setSearch("");
    searchRef.current?.focus();
  };

  const updateQty = (code, mod) => {
    const item = cart.find((i) => i.code === code);
    if (!item) return;
    const next = item.qty + mod;
    if (next <= 0) {
      setCart(cart.filter((i) => i.code !== code));
    } else {
      const prod = products.find((p) => p.code === code);
      if (prod && next > prod.stock) return;
      setCart(cart.map((i) => (i.code === code ? { ...i, qty: next } : i)));
    }
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleVenta = async () => {
    const vuelto = metodoPago === "efectivo" ? (parseInt(efectivo) || 0) - total : 0;
    if (metodoPago === "efectivo" && vuelto < 0) return;

    const { data: v, error: vErr } = await supabase
      .from("ventas")
      .insert([{ total, metodo: metodoPago, usuario: usuario.name }])
      .select();

    if (vErr || !v) return;

    const items = cart.map((i) => ({ venta_id: v[0].id, producto_code: i.code, qty: i.qty, price: i.price }));
    await supabase.from("venta_items").insert(items);

    for (const i of cart) {
      await supabase.from("productos").update({ stock: Math.max(0, i.stock - i.qty) }).eq("code", i.code);
    }

    loadProducts();
    setCart([]);
    setPayModal(false);
    setEfectivo("");
  };

  const agregarTicket = () => {
    console.log("Ticket en espera");
  };

  // Corregido para que conecte directo con la función que actualiza el estado
  if (!usuario) return <Login onLogin={handleLoginSuccess} supabase={supabase} />;

  return (
    <div style={s.app}>
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
            <button style={s.navBtn(view === "ventas")} onClick={() => setView("ventas")}>🧾 Ventas Historial</button>
            <button style={s.navBtn(view === "caja")} onClick={() => setView("caja")}>$ Caja del Día</button>
            <button style={s.navBtn(view === "turnos")} onClick={() => setView("turnos")}>🕒 Turnos</button>
            <button style={s.navBtn(view === "ofertas")} onClick={() => setView("ofertas")}>🏷️ Ofertas</button>
            {usuario.role === "ADMIN" && (
              <button style={s.navBtn(view === "usuarios")} onClick={() => setView("usuarios")}>👥 Usuarios</button>
            )}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #1f2937", paddingTop: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              {usuario.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{usuario.name}</div>
              <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" }}>{usuario.role}</div>
            </div>
            <button style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }} onClick={logout}>➔</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 11, color: "#9ca3af" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: online ? "#10b981" : "#ef4444" }} />
            {online ? "En línea" : "Sin conexión"}
          </div>
        </div>
      </div>

      <div style={s.main}>
        <div style={s.header}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{fmtDate()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#1f2937" }}>{time}</div>
          </div>
        </div>

        <div style={s.content}>
          {view === "pos" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, height: "100%", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="🔍 Buscar por nombre o escanear código de barras... [F2]"
                    style={s.input}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                  <button style={{ ...s.btn, backgroundColor: "#1f2937", color: "#fff" }} onClick={() => setShowVentaRapida(true)}>
                    ⚡ Venta Rápida [F3]
                  </button>
                </div>
                <div style={s.grid}>
                  {products
                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search))
                    .map((p) => (
                      <div key={p.code} style={s.prodCard} onClick={() => addToCart(p)}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", minHeight: 40 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{p.code}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800 }}>{fmt(p.price)}</span>
                          <span style={s.badge(p.stock <= p.min)}>{p.stock} un</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div style={s.card}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800 }}>Carrito</h3>
                <div style={{ minHeight: 200, maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
                  {cart.map((i) => (
                    <div key={i.code} style={s.cartItem}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{i.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{fmt(i.price)} x {i.qty}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button style={s.qtyBtn} onClick={() => updateQty(i.code, -1)}>−</button>
                        <button style={s.qtyBtn} onClick={() => updateQty(i.code, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1.5px solid #e5e7eb", paddingTop: 16, marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                    <span>Total:</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...s.btn, backgroundColor: "#f3f4f6", color: "#1f2937", flex: 1 }} onClick={agregarTicket}>📥 Espera [F5]</button>
                    <button style={{ ...s.btn, backgroundColor: "#16a34a", color: "#fff", flex: 1.5, fontWeight: 700 }} onClick={() => setPayModal(true)} disabled={cart.length === 0}>
                      Cobrar [F4]
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "inventario" && <Inventario supabase={supabase} products={products} loadProducts={loadProducts} s={s} />}
          {view === "ventas" && <Ventas supabase={supabase} fmt={fmt} s={s} />}
          {view === "caja" && <CierreCaja supabase={supabase} usuario={usuario} fmt={fmt} s={s} />}
          {view === "turnos" && <Turnos supabase={supabase} usuario={usuario} s={s} />}
          {view === "ofertas" && <Ofertas supabase={supabase} fmt={fmt} s={s} />}
          {view === "usuarios" && <Usuarios supabase={supabase} s={s} />}
        </div>
      </div>

      {payModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 16px 0" }}>Cobrar Transacción</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6 }}>MÉTODO DE PAGO</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...s.methodBtn, ...(metodoPago === "efectivo" ? s.methodActive : {}) }} onClick={() => setMetodoPago("efectivo")}>💵 Efectivo</button>
                <button style={{ ...s.methodBtn, ...(metodoPago === "tarjeta" ? s.methodActive : {}) }} onClick={() => setMetodoPago("tarjeta")}>💳 Tarjeta</button>
              </div>
            </div>
            {metodoPago === "efectivo" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6 }}>EFECTIVO RECIBIDO</label>
                <input type="number" style={s.cashField} value={efectivo} onChange={(e) => setEfectivo(e.target.value)} placeholder="$0" autoFocus />
                {parseInt(efectivo) >= total && (
                  <div style={s.changeRow}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>Vuelto:</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmt(parseInt(efectivo) - total)}</span>
                  </div>
                )}
              </div>
            )}
            <div style={{ borderTop: "1.5px solid #e5e7eb", paddingTop: 16, display: "flex", gap: 12 }}>
              <button style={s.cancelBtn} onClick={() => setPayModal(false)}>Cancelar</button>
              <button style={s.confirmBtn} onClick={handleVenta}>Confirmar Venta</button>
            </div>
          </div>
        </div>
      )}

      {showVentaRapida && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 16px 0" }}>⚡ Venta Rápida</h3>
            <input
              type="number"
              style={s.input}
              placeholder="Ingrese monto $..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseFloat(e.target.value);
                  if (val > 0) {
                    addToCart({ code: "GENERIC-" + Date.now(), name: "Venta Genérica", price: val, stock: 999, min: 0 });
                    setShowVentaRapida(false);
                  }
                }
              }}
            />
            <button style={{ ...s.cancelBtn, marginTop: 12, width: "100%" }} onClick={() => setShowVentaRapida(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div style={s.modalOverlay}>
          <div style={{ ...s.modal, maxWidth: 600 }}>
            <AddProduct supabase={supabase} onAdd={loadProducts} onClose={() => setShowAddProduct(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  app: { display: "flex", height: "100vh", backgroundColor: "#f3f4f6", fontFamily: "system-ui, sans-serif" },
  sidebar: { width: 260, backgroundColor: "#111827", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 },
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
  cartItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, border: "1.5px solid #d1d5db", backgroundColor: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  methodBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#f9fafb", color: "#4b5563", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  methodActive: { borderColor: "#16a34a", background: "#f0fdf4", color: "#16a34a" },
  cashField: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none", background: "#f9fafb" },
  changeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, background: "#f0fdf4", padding: "8px 14px", borderRadius: 8 },
  cancelBtn: { flex: 1, padding: 12, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#4b5563", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: 12, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }
};
