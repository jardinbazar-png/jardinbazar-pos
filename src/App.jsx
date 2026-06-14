// ═══════════════════════════════════════════════════
// JARDINBAZAR POS v2 — Con productos sin código,
// venta rápida genérica, filtro stock bajo y
// métodos de pago completos (débito, crédito, efectivo, fiado)
// ═══════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import AddProduct from "./AddProduct.jsx";

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
  menu: "M3 12h18M3 6h18M3 18h18",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

export default function POSApp() {
  const [view, setView] = useState("pos");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
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
  const searchRef = useRef(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
    if (!error) setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
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
      if (e.key === "Escape") { setPayModal(false); setShowVentaRapida(false); }
    };
    window.addEventListener("keydown", keys);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("keydown", keys);
    };
  }, [loadProducts, cart]);

  useEffect(() => {
    const channel = supabase.channel("productos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, () => loadProducts())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadProducts]);

  // Filtro con stock bajo opcional
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
      // Venta rápida sin productos
      await supabase.from("detalle_ventas").insert({
        venta_id: venta.id,
        producto_id: null,
        nombre_producto: descExtra || "Venta rápida sin código",
        precio_unitario: montoExtra,
        cantidad: 1,
        subtotal: montoExtra,
      });
    } else {
      const detalles = cart.map(i => ({
        venta_id: venta.id,
        producto_id: i.id,
        nombre_producto: i.nombre,
        precio_unitario: i.precio_venta,
        cantidad: i.qty,
        subtotal: i.precio_venta * i.qty,
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
    setCashInput("");
    setFiadoNombre("");
    setVentaRapidaMonto("");
    setVentaRapidaDesc("");
    setSuccessMsg(`¡Venta registrada! ${fmt(totalFinal)}`);
    setTimeout(() => setSuccessMsg(""), 2500);
    loadProducts();
  };

  const stockBajoCount = products.filter(p => p.existencia <= p.stock_minimo && p.stock_minimo > 0).length;

  return (
    <div style={s.root}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🏪</span>
          <div>
            <div style={s.logoName}>JardínBazar</div>
            <div style={s.logoSub}>Sistema POS</div>
          </div>
        </div>
        {[
          { key: "pos", icon: I.cart, label: "Punto de Venta" },
          { key: "inventario", icon: I.box, label: "Inventario" },
          { key: "caja", icon: I.cash, label: "Caja del Día" },
          { key: "reportes", icon: I.chart, label: "Reportes" },
        ].map(({ key, icon, label }) => (
          <button key={key} style={{ ...s.navBtn, ...(view === key ? s.navActive : {}) }} onClick={() => setView(key)}>
            <Ico path={icon} size={16} />{label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {stockBajoCount > 0 && (
          <div style={s.stockAlert}>
            <Ico path={I.warn} size={14} />
            <span>{stockBajoCount} productos con stock bajo</span>
          </div>
        )}
        <div style={s.statusBar}>
          <span style={{ ...s.dot, background: online ? "#22c55e" : "#ef4444" }} />
          <span style={s.statusTxt}>{online ? "En línea" : "Sin conexión"}</span>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        <header style={s.topbar}>
          <div style={s.topDate}>{fmtDate()}</div>
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
              {/* Barra de búsqueda + botones */}
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
                  <Ico path={I.filter} size={14} />
                  Stock bajo {stockBajoCount > 0 && `(${stockBajoCount})`}
                </button>
                <button style={{ ...s.toolBtn, background: "#f0fdf4", borderColor: "#16a34a", color: "#16a34a" }}
                  onClick={() => setShowVentaRapida(true)}>
                  <Ico path={I.zap} size={14} />
                  Venta rápida [F3]
                </button>
              </div>

              {loading ? (
                <div style={s.center}>Cargando productos...</div>
              ) : (
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
                        <span style={{ ...s.cardStock, color: p.existencia <= 0 ? "#ef4444" : p.existencia <= 5 ? "#f59e0b" : "#6b7280" }}>
                          {p.existencia} uds
                        </span>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div style={s.empty}>
                      <Ico path={I.search} size={32} />
                      <p>{filterStockBajo ? "No hay productos con stock bajo" : `Sin resultados para "${query}"`}</p>
                    </div>
                  )}
                  {filtered.length > 60 && (
                    <div style={{ ...s.empty, fontSize: 12, color: "#9ca3af" }}>
                      Mostrando 60 de {filtered.length} — refina la búsqueda
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* CARRITO */}
            <section style={s.cartPanel}>
              <div style={s.cartHeader}>
                <Ico path={I.cart} size={16} />
                <span style={{ fontWeight: 700 }}>Ticket</span>
                {cart.length > 0 && <button style={s.clearCart} onClick={() => setCart([])}>Limpiar</button>}
              </div>
              <div style={s.cartItems}>
                {cart.length === 0 && (
                  <div style={s.emptyCart}>
                    <Ico path={I.cart} size={36} />
                    <p>Escanea o selecciona productos</p>
                    <p style={{ fontSize: 11, color: "#d1d5db" }}>F3 para venta rápida sin código</p>
                  </div>
                )}
                {cart.map(item => (
                  <div key={item.id} style={s.cartItem}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.cartName}>{item.nombre}</div>
                      <div style={s.cartSub}>{fmt(item.precio_venta)} c/u</div>
                    </div>
                    <div style={s.qtyCtrl}>
                      <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>
                        <Ico path={item.qty === 1 ? I.trash : I.minus} size={12} />
                      </button>
                      <span style={s.qtyNum}>{item.qty}</span>
                      <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>
                        <Ico path={I.plus} size={12} />
                      </button>
                    </div>
                    <div style={s.cartTotal}>{fmt(item.precio_venta * item.qty)}</div>
                  </div>
                ))}
              </div>
              <div style={s.totals}>
                <div style={s.totalRow}><span style={{ color: "#6b7280" }}>Subtotal</span><span>{fmt(total)}</span></div>
                <div style={s.totalBig}><span>TOTAL</span><span>{fmt(total)}</span></div>
              </div>
              <button style={{ ...s.payBtn, opacity: cart.length === 0 ? 0.4 : 1 }}
                disabled={cart.length === 0} onClick={() => setPayModal(true)}>
                <Ico path={I.cash} size={18} /> Cobrar [F4]
              </button>
            </section>
          </div>
        )}

        {/* ── INVENTARIO ── */}
        {view === "inventario" && (
          <div style={s.tableWrap}>
            <div style={s.toolbar}>
              <div style={s.searchBox}>
                <Ico path={I.search} size={15} />
                <input style={s.searchInput} placeholder="Buscar producto…" onChange={e => setQuery(e.target.value)} />
              </div>
              <button style={s.addBtn} onClick={() => { setEditProduct(null); setShowAddProduct(true); }}>+ Agregar producto</button>
              <button style={{ ...s.toolBtn, borderColor: filterStockBajo ? "#d97706" : "#e5e7eb", color: filterStockBajo ? "#d97706" : "#374151" }}
                onClick={() => setFilterStockBajo(!filterStockBajo)}>
                <Ico path={I.filter} size={14} />
                {filterStockBajo ? "Ver todos" : `Stock bajo (${stockBajoCount})`}
              </button>
              <button style={s.reloadBtn} onClick={loadProducts}>
                <Ico path={I.refresh} size={14} /> Actualizar
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <table style={s.table}>
                <thead>
                  <tr>{["Código", "Producto", "Departamento", "Costo", "Precio", "Margen", "Stock", "Mín.", ""].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => {
                      const mq = !query || p.nombre?.toLowerCase().includes(query.toLowerCase());
                      const ms = !filterStockBajo || (p.existencia <= p.stock_minimo && p.stock_minimo > 0);
                      return mq && ms;
                    })
                    .map(p => {
                      const margin = p.precio_venta > 0 ? ((p.precio_venta - p.precio_costo) / p.precio_venta * 100).toFixed(1) : 0;
                      const isLow = p.existencia <= p.stock_minimo && p.stock_minimo > 0;
                      return (
                        <tr key={p.id} style={{ background: isLow ? "#fef9c3" : "transparent" }}>
                          <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{p.codigo}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{p.nombre}</td>
                          <td style={s.td}><span style={s.dept}>{p.departamento}</span></td>
                          <td style={{ ...s.td, color: "#6b7280" }}>{fmt(p.precio_costo)}</td>
                          <td style={{ ...s.td, fontWeight: 700 }}>{fmt(p.precio_venta)}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: parseFloat(margin) > 20 ? "#16a34a" : "#d97706" }}>{margin}%</td>
                          <td style={s.td}>
                            <span style={{ color: p.existencia <= 0 ? "#ef4444" : isLow ? "#f59e0b" : "#16a34a", fontWeight: 600 }}>
                              {isLow && "⚠ "}{p.existencia}
                            </span>
                          </td>
                          <td style={{ ...s.td, color: "#9ca3af" }}>{p.stock_minimo}</td>
                          <td style={s.td}>
                            <button style={s.editBtn} onClick={() => { setEditProduct(p); setShowAddProduct(true); }}>Editar</button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CAJA ── */}
        {view === "caja" && (
          <div style={s.cajaWrap}>
            <div style={s.cajaGrid}>
              {[
                { label: "Ventas del día", value: fmt(totalVentas), color: "#16a34a" },
                { label: "Transacciones", value: saleCount, color: "#2563eb" },
                { label: "Ticket promedio", value: saleCount > 0 ? fmt(totalVentas / saleCount) : fmt(0), color: "#9333ea" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ ...s.kpiCard, borderColor: color + "33" }}>
                  <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>{label}</div>
                  <div style={{ color, fontSize: 26, fontWeight: 800 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={s.cajaNote}>
              <Ico path={I.warn} size={16} />
              <span>El módulo completo de cuadratura de caja se activa en la próxima etapa.</span>
            </div>
          </div>
        )}

        {/* ── REPORTES ── */}
        {view === "reportes" && (
          <div style={s.cajaWrap}>
            <div style={s.cajaNote}>
              <Ico path={I.chart} size={16} />
              <span>Los reportes con gráficos y desglose de comisiones por tarjeta se activan en la próxima etapa.</span>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL COBRO ── */}
      {payModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setPayModal(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Cobrar venta</span>
              <button style={s.iconBtn} onClick={() => setPayModal(false)}><Ico path={I.x} size={18} /></button>
            </div>
            <div style={s.modalTotal}>{fmt(total)}</div>
            <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
              {cart.length} producto{cart.length !== 1 ? "s" : ""}
            </div>

            {/* MÉTODOS DE PAGO */}
            <div style={s.methods}>
              {[
                { key: "efectivo", icon: I.cash, label: "Efectivo" },
                { key: "debito", icon: I.card, label: "Débito" },
                { key: "credito", icon: I.card, label: "Crédito" },
                { key: "transferencia", icon: I.transfer, label: "Transferencia" },
                { key: "fiado", icon: I.user, label: "Fiado" },
              ].map(({ key, icon, label }) => (
                <button key={key}
                  style={{ ...s.methodBtn, ...(payMethod === key ? s.methodActive : {}) }}
                  onClick={() => setPayMethod(key)}>
                  <Ico path={icon} size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {payMethod === "efectivo" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Efectivo recibido</label>
                <input style={s.cashField} type="number" placeholder="0"
                  value={cashInput} onChange={e => setCashInput(e.target.value)} autoFocus />
                {cashInput && (
                  <div style={s.changeRow}>
                    <span style={{ color: "#6b7280" }}>Vuelto:</span>
                    <span style={{ color: change >= 0 ? "#16a34a" : "#ef4444", fontWeight: 800, fontSize: 22 }}>
                      {fmt(Math.max(0, change))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(payMethod === "debito" || payMethod === "credito") && (
              <div style={{ marginBottom: 16, background: "#eff6ff", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#2563eb" }}>
                ℹ️ La comisión por {payMethod} se descontará automáticamente en los reportes de ganancia.
              </div>
            )}

            {payMethod === "fiado" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Nombre del cliente</label>
                <input style={s.cashField} type="text" placeholder="Nombre de quien fía"
                  value={fiadoNombre} onChange={e => setFiadoNombre(e.target.value)} autoFocus />
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.cancelBtn} onClick={() => setPayModal(false)}>Cancelar</button>
              <button
                style={{ ...s.confirmBtn, opacity: (payMethod === "efectivo" && parseFloat(cashInput || 0) < total) || (payMethod === "fiado" && !fiadoNombre) ? 0.4 : 1 }}
                disabled={(payMethod === "efectivo" && parseFloat(cashInput || 0) < total) || (payMethod === "fiado" && !fiadoNombre)}
                onClick={() => completeSale()}>
                <Ico path={I.check} size={18} /> Confirmar
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
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
              Para productos sin código de barra o ventas de terceros.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>Descripción (opcional)</label>
              <input style={s.cashField} type="text" placeholder="Ej: Producto sin código, venta terceros..."
                value={ventaRapidaDesc} onChange={e => setVentaRapidaDesc(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>Monto ($)</label>
              <input style={{ ...s.cashField, fontSize: 28 }} type="number" placeholder="0"
                value={ventaRapidaMonto} onChange={e => setVentaRapidaMonto(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.cancelBtn} onClick={() => setShowVentaRapida(false)}>Cancelar</button>
              <button style={{ ...s.confirmBtn, opacity: !ventaRapidaMonto || parseFloat(ventaRapidaMonto) <= 0 ? 0.4 : 1 }}
                disabled={!ventaRapidaMonto || parseFloat(ventaRapidaMonto) <= 0}
                onClick={() => completeSale(parseFloat(ventaRapidaMonto), ventaRapidaDesc)}>
                <Ico path={I.check} size={18} /> Registrar venta
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <AddProduct productToEdit={editProduct}
          onClose={() => { setShowAddProduct(false); setEditProduct(null); }}
          onSaved={loadProducts} />
      )}

      {successMsg && (
        <div style={s.successFlash}>
          <Ico path={I.check} size={28} />
          <span>{successMsg}</span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f3f4f6; font-family: 'Inter', sans-serif; }
        button { font-family: 'Inter', sans-serif; cursor: pointer; }
        input { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
      `}</style>
    </div>
  );
}

const s = {
  root: { display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", background: "#f3f4f6", overflow: "hidden" },
  sidebar: { width: 210, background: "#111827", display: "flex", flexDirection: "column", padding: "0 0 16px", flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 24px", borderBottom: "1px solid #1f2937", marginBottom: 8 },
  logoIcon: { fontSize: 28 },
  logoName: { fontWeight: 800, fontSize: 14, color: "#f9fafb", letterSpacing: 0.5 },
  logoSub: { fontSize: 10, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase" },
  navBtn: { display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "none", border: "none", color: "#9ca3af", fontSize: 13, fontWeight: 500, textAlign: "left", transition: "all .15s", borderLeft: "3px solid transparent" },
  navActive: { background: "#1f2937", color: "#f9fafb", borderLeftColor: "#22c55e" },
  stockAlert: { display: "flex", alignItems: "center", gap: 6, margin: "0 12px 8px", padding: "8px 10px", background: "#fef3c7", borderRadius: 6, color: "#d97706", fontSize: 11, fontWeight: 600 },
  statusBar: { display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid #1f2937" },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  statusTxt: { color: "#6b7280", fontSize: 12 },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 },
  topDate: { fontSize: 13, color: "#374151", fontWeight: 600, textTransform: "capitalize" },
  topRight: { display: "flex", alignItems: "center", gap: 20 },
  kpi: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  kpiLabel: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 },
  kpiVal: { fontSize: 15, fontWeight: 800, color: "#111827" },
  clock: { fontSize: 20, fontWeight: 800, color: "#111827", fontVariantNumeric: "tabular-nums" },
  posLayout: { display: "flex", flex: 1, overflow: "hidden" },
  prodPanel: { flex: 1, display: "flex", flexDirection: "column", padding: 16, overflow: "hidden" },
  posToolbar: { display: "flex", gap: 10, marginBottom: 14, flexShrink: 0, flexWrap: "wrap" },
  searchBox: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 14px", color: "#9ca3af" },
  searchInput: { flex: 1, border: "none", outline: "none", padding: "11px 0", fontSize: 14, color: "#111827", background: "transparent" },
  clearBtn: { background: "none", border: "none", display: "flex", alignItems: "center", color: "#9ca3af" },
  toolBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10, overflowY: "auto", flex: 1, alignContent: "start" },
  card: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", textAlign: "left", display: "flex", flexDirection: "column", gap: 4, transition: "all .12s", position: "relative", overflow: "hidden" },
  agotado: { position: "absolute", top: 6, right: 6, background: "#fee2e2", color: "#ef4444", borderRadius: 3, padding: "1px 6px", fontSize: 9, fontWeight: 700 },
  lowStock: { position: "absolute", top: 6, right: 6, background: "#fef3c7", color: "#d97706", borderRadius: 3, padding: "1px 6px", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 },
  cardDept: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 },
  cardName: { fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: 800, color: "#16a34a" },
  cardStock: { fontSize: 11 },
  empty: { gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#d1d5db", paddingTop: 60 },
  center: { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#9ca3af" },
  cartPanel: { width: 310, background: "#fff", borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 },
  cartHeader: { display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid #f3f4f6", color: "#374151", flexShrink: 0, fontWeight: 700 },
  clearCart: { marginLeft: "auto", background: "none", border: "none", color: "#ef4444", fontSize: 12, fontWeight: 600 },
  cartItems: { flex: 1, overflowY: "auto" },
  emptyCart: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#d1d5db", gap: 10, fontSize: 13 },
  cartItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid #f9fafb" },
  cartName: { fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cartSub: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  qtyCtrl: { display: "flex", alignItems: "center", gap: 2, flexShrink: 0 },
  qtyBtn: { background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" },
  qtyNum: { width: 24, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#111827" },
  cartTotal: { fontSize: 13, fontWeight: 800, color: "#16a34a", whiteSpace: "nowrap" },
  totals: { padding: "12px 16px", borderTop: "1px solid #f3f4f6", flexShrink: 0 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#374151" },
  totalBig: { display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, color: "#111827", paddingTop: 8, borderTop: "1px solid #e5e7eb", marginTop: 4 },
  payBtn: { margin: "10px 16px", padding: 14, background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity .15s" },
  tableWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 20 },
  toolbar: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" },
  addBtn: { padding: "8px 14px", background: "#16a34a", border: "none", borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 700 },
  reloadBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 6, color: "#374151", fontSize: 13, fontWeight: 600 },
  editBtn: { background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 4, padding: "4px 10px", fontSize: 11, color: "#374151", fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", borderRadius: 10, overflow: "hidden" },
  th: { padding: "10px 14px", textAlign: "left", color: "#6b7280", fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", position: "sticky", top: 0 },
  td: { padding: "11px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151" },
  dept: { background: "#eff6ff", color: "#2563eb", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 700 },
  cajaWrap: { flex: 1, overflowY: "auto", padding: 20 },
  cajaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 },
  kpiCard: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" },
  cajaNote: { display: "flex", alignItems: "center", gap: 10, background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, padding: "14px 18px", color: "#854d0e", fontSize: 13 },
  overlay: { position: "fixed", inset: 0, background: "#00000066", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px #0003" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  iconBtn: { background: "none", border: "none", color: "#9ca3af", display: "flex" },
  modalTotal: { fontSize: 38, fontWeight: 800, color: "#16a34a", textAlign: "center", marginBottom: 4 },
  methods: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  methodBtn: { flex: 1, minWidth: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, color: "#6b7280", fontSize: 11, fontWeight: 600, transition: "all .15s" },
  methodActive: { background: "#16a34a", color: "#fff", borderColor: "#16a34a" },
  cashField: { width: "100%", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", fontSize: 22, fontWeight: 700, color: "#111827", outline: "none" },
  changeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "10px 0" },
  cancelBtn: { flex: 1, padding: 13, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontSize: 14, fontWeight: 600 },
  confirmBtn: { flex: 2, padding: 13, background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity .15s" },
  successFlash: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#16a34a", color: "#fff", borderRadius: 16, padding: "24px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 300, boxShadow: "0 0 60px #16a34a55", animation: "pulse .3s ease" },
};
