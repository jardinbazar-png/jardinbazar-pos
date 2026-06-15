import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import AddProduct from "./AddProduct.jsx";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

const fmt = n => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

const Ico = ({ path, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const I = {
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  filter:  "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  warn:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  copy:    "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  x:       "M18 6L6 18M6 6l12 12",
  check:   "M20 6L9 17l-5-5",
  trash:   "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  history: "M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3",
  alert:   "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  minus:   "M5 12h14",
  plus:    "M12 5v14M5 12h14",
};

const TABS = ["tabla", "mermas", "historial"];

const MOTIVOS_MERMA = ["Vencimiento", "Robo", "Mal conteo", "Daño / rotura", "Olvido", "Otro"];

export default function Inventario({ products, loadProducts, isAdmin }) {
  const [tab, setTab] = useState("tabla");
  const [query, setQuery] = useState("");
  const [filterStockBajo, setFilterStockBajo] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  // Mermas
  const [mermaProducto, setMermaProducto] = useState(null);
  const [mermaCantidad, setMermaCantidad] = useState(1);
  const [mermaMotivo, setMermaMotivo] = useState(MOTIVOS_MERMA[0]);
  const [mermaObs, setMermaObs] = useState("");
  const [savingMerma, setSavingMerma] = useState(false);
  const [mermas, setMermas] = useState([]);
  const [loadingMermas, setLoadingMermas] = useState(false);

  // Historial modificaciones
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const stockBajoCount = products.filter(p => p.existencia <= p.stock_minimo && p.stock_minimo > 0).length;

  const departamentos = [...new Set(products.map(p => p.departamento).filter(Boolean))].sort();

  const filtered = products.filter(p => {
    const mq = !query || p.nombre?.toLowerCase().includes(query.toLowerCase()) || p.codigo?.toString().includes(query);
    const ms = !filterStockBajo || (p.existencia <= p.stock_minimo && p.stock_minimo > 0);
    const md = !filterDept || p.departamento === filterDept;
    return mq && ms && md;
  });

  const loadMermas = useCallback(async () => {
    setLoadingMermas(true);
    const { data } = await supabase.from("mermas").select("*, productos(nombre)").order("created_at", { ascending: false }).limit(100);
    setMermas(data || []);
    setLoadingMermas(false);
  }, []);

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    const { data } = await supabase.from("historial_productos").select("*").order("created_at", { ascending: false }).limit(100);
    setHistorial(data || []);
    setLoadingHistorial(false);
  }, []);

  const handleTab = (t) => {
    setTab(t);
    if (t === "mermas") loadMermas();
    if (t === "historial") loadHistorial();
  };

  const registrarMerma = async () => {
    if (!mermaProducto || mermaCantidad <= 0) return;
    setSavingMerma(true);
    const cant = parseInt(mermaCantidad);

    // Insertar en tabla mermas
    await supabase.from("mermas").insert({
      producto_id: mermaProducto.id,
      cantidad: cant,
      motivo: mermaMotivo,
      observacion: mermaObs,
      costo_unitario: mermaProducto.precio_costo,
    });

    // Descontar del stock
    await supabase.from("productos")
      .update({ existencia: Math.max(0, mermaProducto.existencia - cant) })
      .eq("id", mermaProducto.id);

    // Registrar en historial
    await supabase.from("historial_productos").insert({
      producto_id: mermaProducto.id,
      nombre_producto: mermaProducto.nombre,
      tipo: "merma",
      detalle: `${mermaMotivo}: -${cant} unidades. ${mermaObs}`,
      stock_antes: mermaProducto.existencia,
      stock_despues: Math.max(0, mermaProducto.existencia - cant),
    });

    setSavingMerma(false);
    setMermaProducto(null);
    setMermaCantidad(1);
    setMermaObs("");
    loadProducts();
    loadMermas();
  };

  const tabLabel = { tabla: "📦 Productos", mermas: "⚠️ Mermas y pérdidas", historial: "🕓 Historial" };

  return (
    <div style={s.wrap}>
      {/* TABS */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => handleTab(t)}>
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* ── TAB: TABLA PRODUCTOS ── */}
      {tab === "tabla" && (
        <>
          <div style={s.toolbar}>
            <div style={s.searchBox}>
              <Ico path={I.search} size={15} />
              <input style={s.searchInput} placeholder="Buscar por nombre o código…" value={query} onChange={e => setQuery(e.target.value)} />
              {query && <button style={s.clearBtn} onClick={() => setQuery("")}><Ico path={I.x} size={13} /></button>}
            </div>

            <select style={s.select} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">Todos los departamentos</option>
              {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <button style={{ ...s.toolBtn, borderColor: filterStockBajo ? "#d97706" : "#e5e7eb", color: filterStockBajo ? "#d97706" : "#374151", background: filterStockBajo ? "#fef3c7" : "#fff" }}
              onClick={() => setFilterStockBajo(!filterStockBajo)}>
              <Ico path={I.filter} size={14} />{filterStockBajo ? "Ver todos" : `Stock bajo (${stockBajoCount})`}
            </button>

            <button style={s.addBtn} onClick={() => { setEditProduct(null); setIsDuplicateMode(false); setShowAddProduct(true); }}>
              + Agregar producto
            </button>

            <button style={s.reloadBtn} onClick={loadProducts}>
              <Ico path={I.refresh} size={14} />
            </button>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Código", "Producto", "Depto.", ...(isAdmin ? ["Costo s/IVA", "Costo c/IVA", "Margen"] : []), "Precio venta", "Stock", "Mín.", ""].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const costoSinIva = p.precio_costo || 0;
                  const costoConIva = p.iva > 0 ? Math.round(costoSinIva * 1.19) : costoSinIva;
                  const margin = p.precio_venta > 0 ? ((p.precio_venta - costoConIva) / p.precio_venta * 100).toFixed(1) : 0;
                  const isLow = p.existencia <= p.stock_minimo && p.stock_minimo > 0;
                  const marginNum = parseFloat(margin);
                  const marginColor = marginNum >= 25 ? "#16a34a" : marginNum >= 10 ? "#d97706" : "#ef4444";

                  return (
                    <tr key={p.id} style={{ background: isLow ? "#fef9c3" : "transparent" }}>
                      <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{p.codigo}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        {p.nombre}
                        {p.fecha_vencimiento && new Date(p.fecha_vencimiento) < new Date(Date.now() + 7 * 86400000) && (
                          <span style={s.venceBadge}>⚠ Vence {new Date(p.fecha_vencimiento).toLocaleDateString("es-CL")}</span>
                        )}
                      </td>
                      <td style={s.td}><span style={s.dept}>{p.departamento}</span></td>
                      {isAdmin && <>
                        <td style={{ ...s.td, color: "#6b7280", fontSize: 12 }}>{fmt(costoSinIva)}</td>
                        <td style={{ ...s.td, color: "#374151", fontSize: 12 }}>{fmt(costoConIva)}{p.iva > 0 && <span style={s.ivaBadge}>IVA</span>}</td>
                        <td style={{ ...s.td, fontWeight: 700, color: marginColor }}>
                          {marginNum >= 25 ? "✓ " : marginNum >= 10 ? "~ " : "⚠ "}{margin}%
                        </td>
                      </>}
                      <td style={{ ...s.td, fontWeight: 700 }}>{fmt(p.precio_venta)}</td>
                      <td style={s.td}>
                        <span style={{
                          color: p.existencia <= 0 ? "#ef4444" : isLow ? "#f59e0b" : "#16a34a",
                          fontWeight: 700,
                          background: p.existencia <= 0 ? "#fee2e2" : isLow ? "#fef3c7" : "#f0fdf4",
                          padding: "2px 8px", borderRadius: 6, fontSize: 12
                        }}>
                          {isLow && "⚠ "}{p.existencia}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: "#9ca3af" }}>{p.stock_minimo}</td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={s.editBtn} onClick={() => { setEditProduct(p); setIsDuplicateMode(false); setShowAddProduct(true); }}>Editar</button>
                          <button style={{ ...s.editBtn, color: "#2563eb" }}
                            onClick={() => { setEditProduct(p); setIsDuplicateMode(true); setShowAddProduct(true); }}
                            title="Duplicar">
                            <Ico path={I.copy} size={11} />
                          </button>
                          <button style={{ ...s.editBtn, color: "#ef4444" }}
                            onClick={() => { setMermaProducto(p); setTab("mermas"); }}
                            title="Registrar merma/pérdida">
                            <Ico path={I.minus} size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={99} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={s.tableFooter}>{filtered.length} productos {filterDept && `en ${filterDept}`}</div>
        </>
      )}

      {/* ── TAB: MERMAS ── */}
      {tab === "mermas" && (
        <div style={s.tabContent}>
          <div style={s.section}>Registrar merma o pérdida</div>

          {/* Selector producto */}
          <div style={s.field}>
            <label style={s.label}>Producto afectado</label>
            <div style={s.searchBox}>
              <Ico path={I.search} size={14} />
              <input style={s.searchInput}
                placeholder="Busca el producto..."
                value={mermaProducto ? mermaProducto.nombre : query}
                onChange={e => { setQuery(e.target.value); setMermaProducto(null); }} />
              {mermaProducto && <button style={s.clearBtn} onClick={() => { setMermaProducto(null); setQuery(""); }}><Ico path={I.x} size={13} /></button>}
            </div>
            {!mermaProducto && query.length > 0 && (
              <div style={s.dropdown}>
                {products.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map(p => (
                  <button key={p.id} style={s.dropItem} onClick={() => { setMermaProducto(p); setQuery(""); }}>
                    <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                    <span style={{ color: "#6b7280", fontSize: 12 }}>Stock: {p.existencia}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {mermaProducto && (
            <div style={s.mermaCard}>
              <div style={{ fontWeight: 700 }}>{mermaProducto.nombre}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Stock actual: <b>{mermaProducto.existencia}</b> · Costo: {fmt(mermaProducto.precio_costo)}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ ...s.field, maxWidth: 120 }}>
              <label style={s.label}>Cantidad</label>
              <input style={s.input} type="number" min="1" value={mermaCantidad} onChange={e => setMermaCantidad(e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Motivo</label>
              <select style={s.input} value={mermaMotivo} onChange={e => setMermaMotivo(e.target.value)}>
                {MOTIVOS_MERMA.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Observación (opcional)</label>
            <input style={s.input} type="text" placeholder="Ej: caja caída, proveedor lo repone..." value={mermaObs} onChange={e => setMermaObs(e.target.value)} />
          </div>

          {mermaProducto && (
            <div style={s.mermaResumen}>
              <span>Pérdida estimada:</span>
              <span style={{ color: "#ef4444", fontWeight: 800 }}>- {fmt(mermaProducto.precio_costo * parseInt(mermaCantidad || 0))}</span>
            </div>
          )}

          <button style={{ ...s.saveBtn, opacity: !mermaProducto || mermaCantidad <= 0 ? 0.4 : 1 }}
            disabled={!mermaProducto || mermaCantidad <= 0 || savingMerma}
            onClick={registrarMerma}>
            {savingMerma ? "Registrando..." : "✓ Registrar pérdida y descontar stock"}
          </button>

          {/* Listado mermas recientes */}
          <div style={s.section}>Pérdidas registradas</div>
          {loadingMermas && <div style={{ color: "#9ca3af", fontSize: 13 }}>Cargando...</div>}
          {mermas.length === 0 && !loadingMermas && <div style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>Sin mermas registradas</div>}
          {mermas.map(m => (
            <div key={m.id} style={s.mermaRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.productos?.nombre || "—"}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{m.motivo} · {new Date(m.created_at).toLocaleDateString("es-CL")}</div>
                {m.observacion && <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.observacion}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#ef4444", fontWeight: 700 }}>-{m.cantidad} uds</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>- {fmt(m.costo_unitario * m.cantidad)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === "historial" && (
        <div style={s.tabContent}>
          <div style={s.section}>Historial de modificaciones de productos</div>
          {loadingHistorial && <div style={{ color: "#9ca3af", fontSize: 13 }}>Cargando...</div>}
          {historial.length === 0 && !loadingHistorial && <div style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>Sin registros aún</div>}
          {historial.map(h => (
            <div key={h.id} style={s.histRow}>
              <div style={s.histTipo(h.tipo)}>{h.tipo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{h.nombre_producto}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{h.detalle}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: "#9ca3af" }}>
                {h.stock_antes !== null && <div>{h.stock_antes} → {h.stock_despues} uds</div>}
                <div>{new Date(h.created_at).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
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
    </div>
  );
}

const s = {
  wrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  tabs: { display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb", padding: "0 24px", background: "#fff" },
  tab: { padding: "14px 20px", background: "none", border: "none", borderBottom: "2px solid transparent", marginBottom: -2, fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" },
  tabActive: { borderBottomColor: "#16a34a", color: "#16a34a" },
  toolbar: { display: "flex", gap: 10, padding: "16px 24px", alignItems: "center", background: "#fff", borderBottom: "1px solid #e5e7eb" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 12px", height: 38, flex: 1, position: "relative" },
  searchInput: { border: "none", outline: "none", width: "100%", fontSize: 13, color: "#111827", background: "transparent" },
  clearBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 2 },
  select: { border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 10px", height: 38, fontSize: 13, color: "#374151", background: "#fff", outline: "none" },
  toolBtn: { display: "flex", alignItems: "center", gap: 6, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 12px", height: 38, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  addBtn: { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", height: 38, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  reloadBtn: { background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 10px", height: 38, color: "#4b5563", cursor: "pointer", display: "flex", alignItems: "center" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: { padding: "10px 16px", background: "#f9fafb", borderBottom: "1.5px solid #e5e7eb", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" },
  td: { padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: 13, color: "#111827" },
  dept: { background: "#f3f4f6", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#4b5563" },
  ivaBadge: { background: "#eff6ff", color: "#2563eb", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, marginLeft: 4 },
  venceBadge: { display: "block", fontSize: 10, color: "#dc2626", fontWeight: 600, marginTop: 2 },
  editBtn: { background: "none", border: "none", color: "#16a34a", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 6px" },
  tableFooter: { padding: "10px 24px", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #e5e7eb", background: "#fff" },
  tabContent: { flex: 1, overflowY: "auto", padding: 24, maxWidth: 700 },
  section: { fontWeight: 700, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 12px", paddingTop: 16, borderTop: "1px solid #e5e7eb" },
  field: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, position: "relative" },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: { border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#111827", outline: "none", background: "#f9fafb", fontFamily: "inherit" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, marginTop: 4 },
  dropItem: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f3f4f6", textAlign: "left" },
  mermaCard: { background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 },
  mermaResumen: { display: "flex", justifyContent: "space-between", background: "#fee2e2", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600, marginBottom: 12 },
  saveBtn: { width: "100%", padding: 13, background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 8 },
  mermaRow: { display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8 },
  histRow: { display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8 },
  histTipo: (tipo) => ({
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap",
    background: tipo === "merma" ? "#fee2e2" : tipo === "edicion" ? "#eff6ff" : "#f0fdf4",
    color: tipo === "merma" ? "#dc2626" : tipo === "edicion" ? "#2563eb" : "#16a34a",
  }),
};
