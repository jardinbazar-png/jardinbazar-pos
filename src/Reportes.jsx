import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

const RANGOS = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes", label: "30 días" },
  { key: "todo", label: "Todo" },
];

const TABS = [
  { key: "ranking", label: "🏆 Más Vendidos" },
  { key: "categorias", label: "📦 Por Categoría/Marca" },
  { key: "resumen", label: "📋 Resumen del Período" },
  { key: "graficos", label: "📈 Gráficos" },
];

function getDesde(tipo) {
  const ahora = new Date();
  if (tipo === "hoy") { const d = new Date(ahora); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (tipo === "semana") { const d = new Date(ahora); d.setDate(d.getDate() - 7); return d.toISOString(); }
  if (tipo === "mes") { const d = new Date(ahora); d.setDate(d.getDate() - 30); return d.toISOString(); }
  return null;
}

function bucketKey(d, rango) {
  if (rango === "hoy") return d.getHours();
  if (rango === "todo") return d.getFullYear() * 100 + (d.getMonth() + 1);
  return Math.floor(d.getTime() / 86400000);
}
function bucketLabel(d, rango) {
  if (rango === "hoy") return `${String(d.getHours()).padStart(2, "0")}:00`;
  if (rango === "todo") return d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

const METODO_LABEL = { efectivo: "Efectivo", debito: "Débito", credito: "Crédito", transferencia: "Transferencia", fiado: "Fiado" };

export default function Reportes() {
  const [rango, setRango] = useState("semana");
  const [tab, setTab] = useState("ranking");
  const [dimension, setDimension] = useState("categoria");

  const [ventasRango, setVentasRango] = useState([]);
  const [detalleRango, setDetalleRango] = useState([]);
  const [productosMap, setProductosMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase.from("productos").select("id, categoria, marca, tipo").then(({ data, error }) => {
      if (!error && data) {
        setProductosMap(new Map(data.map((p) => [p.id, p])));
      }
    });
  }, []);

  const cargarDatos = useCallback(async (tipo) => {
    setLoading(true);
    setErrorMsg("");
    const desde = getDesde(tipo);

    let qVentas = supabase.from("ventas").select("id, total, metodo_pago, fecha");
    if (desde) qVentas = qVentas.gte("fecha", desde);

    let qDetalle = supabase.from("detalle_ventas").select("producto_id, producto_nombre, cantidad, subtotal, ventas!inner(fecha)");
    if (desde) qDetalle = qDetalle.gte("ventas.fecha", desde);

    const [resVentas, resDetalle] = await Promise.all([qVentas, qDetalle]);

    if (resVentas.error || resDetalle.error) {
      setErrorMsg("Error al cargar datos: " + (resVentas.error?.message || resDetalle.error?.message));
      setVentasRango([]);
      setDetalleRango([]);
      setLoading(false);
      return;
    }

    setVentasRango(resVentas.data || []);
    setDetalleRango(resDetalle.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarDatos(rango); }, [rango, cargarDatos]);

  const ranking = useMemo(() => {
    const map = new Map();
    detalleRango.forEach((d) => {
      const key = d.producto_id || `n:${d.producto_nombre}`;
      if (!map.has(key)) map.set(key, { nombre: d.producto_nombre, cantidad: 0, total: 0 });
      const r = map.get(key);
      r.cantidad += Number(d.cantidad) || 0;
      r.total += Number(d.subtotal) || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 20);
  }, [detalleRango]);

  const categoriasAgg = useMemo(() => {
    const map = new Map();
    detalleRango.forEach((d) => {
      const prod = productosMap.get(d.producto_id);
      const valor = prod?.[dimension] || "Sin clasificar";
      if (!map.has(valor)) map.set(valor, { nombre: valor, cantidad: 0, total: 0 });
      const r = map.get(valor);
      r.cantidad += Number(d.cantidad) || 0;
      r.total += Number(d.subtotal) || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [detalleRango, productosMap, dimension]);

  const resumen = useMemo(() => {
    const totalVentas = ventasRango.reduce((s, v) => s + (Number(v.total) || 0), 0);
    const cantidad = ventasRango.length;
    const promedio = cantidad > 0 ? totalVentas / cantidad : 0;
    const porMetodo = new Map();
    ventasRango.forEach((v) => {
      const base = (v.metodo_pago || "otro").split("_fiado:")[0];
      if (!porMetodo.has(base)) porMetodo.set(base, { metodo: base, cantidad: 0, total: 0 });
      const r = porMetodo.get(base);
      r.cantidad += 1;
      r.total += Number(v.total) || 0;
    });
    return { totalVentas, cantidad, promedio, porMetodo: Array.from(porMetodo.values()).sort((a, b) => b.total - a.total) };
  }, [ventasRango]);

  const serieTiempo = useMemo(() => {
    const map = new Map();
    ventasRango.forEach((v) => {
      const d = new Date(v.fecha);
      const key = bucketKey(d, rango);
      if (!map.has(key)) map.set(key, { key, label: bucketLabel(d, rango), total: 0 });
      map.get(key).total += Number(v.total) || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.key - b.key);
  }, [ventasRango, rango]);

  const maxBarra = Math.max(...serieTiempo.map((p) => p.total), 1);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.tabs}>
          {TABS.map((t) => (
            <button key={t.key} style={{ ...s.tabBtn, ...(tab === t.key ? s.tabActivo : {}) }} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={s.rangos}>
          {RANGOS.map((r) => (
            <button key={r.key} style={{ ...s.rangoBtn, ...(rango === r.key ? s.rangoActivo : {}) }} onClick={() => setRango(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <div style={s.error}>{errorMsg}</div>}
      {loading && <div style={s.empty}>Cargando...</div>}

      {!loading && tab === "ranking" && (
        <div style={s.tableContainer}>
          <table style={s.table}>
            <thead><tr><th style={s.th}>#</th><th style={s.th}>Producto</th><th style={{ ...s.th, textAlign: "right" }}>Cantidad</th><th style={{ ...s.th, textAlign: "right" }}>Ingreso</th></tr></thead>
            <tbody>
              {ranking.length === 0 && <tr><td colSpan="4" style={s.empty}>Sin ventas en este período</td></tr>}
              {ranking.map((r, idx) => (
                <tr key={idx}><td style={s.td}>{idx + 1}</td><td style={{ ...s.td, fontWeight: 600 }}>{r.nombre}</td><td style={{ ...s.td, textAlign: "right" }}>{r.cantidad}</td><td style={{ ...s.td, textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{fmt(r.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "categorias" && (
        <>
          <div style={s.dimSelector}>
            {["categoria", "marca", "tipo"].map((dim) => (
              <button key={dim} style={{ ...s.dimBtn, ...(dimension === dim ? s.dimActivo : {}) }} onClick={() => setDimension(dim)}>
                {dim === "categoria" ? "Categoría" : dim === "marca" ? "Marca" : "Tipo"}
              </button>
            ))}
          </div>
          <div style={s.tableContainer}>
            <table style={s.table}>
              <thead><tr><th style={s.th}>{dimension === "categoria" ? "Categoría" : dimension === "marca" ? "Marca" : "Tipo"}</th><th style={{ ...s.th, textAlign: "right" }}>Unidades vendidas</th><th style={{ ...s.th, textAlign: "right" }}>Ingreso</th></tr></thead>
              <tbody>
                {categoriasAgg.length === 0 && <tr><td colSpan="3" style={s.empty}>Sin ventas en este período</td></tr>}
                {categoriasAgg.map((r, idx) => (
                  <tr key={idx}><td style={{ ...s.td, fontWeight: 600 }}>{r.nombre}</td><td style={{ ...s.td, textAlign: "right" }}>{r.cantidad}</td><td style={{ ...s.td, textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{fmt(r.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && tab === "resumen" && (
        <>
          <div style={s.kpis}>
            <div style={s.kpiBox}><span style={s.kpiLabel}>Total vendido</span><span style={{ ...s.kpiVal, color: "#16a34a" }}>{fmt(resumen.totalVentas)}</span></div>
            <div style={s.kpiBox}><span style={s.kpiLabel}>Tickets emitidos</span><span style={s.kpiVal}>{resumen.cantidad}</span></div>
            <div style={s.kpiBox}><span style={s.kpiLabel}>Ticket promedio</span><span style={s.kpiVal}>{fmt(resumen.promedio)}</span></div>
          </div>
          <div style={s.tableContainer}>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Método de pago</th><th style={{ ...s.th, textAlign: "right" }}>Tickets</th><th style={{ ...s.th, textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {resumen.porMetodo.length === 0 && <tr><td colSpan="3" style={s.empty}>Sin ventas en este período</td></tr>}
                {resumen.porMetodo.map((r, idx) => (
                  <tr key={idx}><td style={{ ...s.td, fontWeight: 600 }}>{METODO_LABEL[r.metodo] || r.metodo}</td><td style={{ ...s.td, textAlign: "right" }}>{r.cantidad}</td><td style={{ ...s.td, textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{fmt(r.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && tab === "graficos" && (
        <div style={s.chartBox}>
          {serieTiempo.length === 0 && <div style={s.empty}>Sin ventas en este período</div>}
          {serieTiempo.length > 0 && (
            <div style={s.chartArea}>
              {serieTiempo.map((p) => (
                <div key={p.key} style={s.barCol}>
                  <span style={s.barVal}>{fmt(p.total)}</span>
                  <div style={{ ...s.bar, height: `${(p.total / maxBarra) * 160}px` }} />
                  <span style={s.barLabel}>{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { flex: 1, display: "flex", flexDirection: "column", padding: 20, background: "#fff", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  tabs: { display: "flex", gap: 6 },
  tabBtn: { padding: "8px 14px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700 },
  tabActivo: { background: "#0f172a", color: "#fff", borderColor: "#0f172a" },
  rangos: { display: "flex", gap: 6 },
  rangoBtn: { padding: "6px 14px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700 },
  rangoActivo: { background: "#1e3a8a", color: "#fff", borderColor: "#1e3a8a" },
  dimSelector: { display: "flex", gap: 6, marginBottom: 12 },
  dimBtn: { padding: "6px 14px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700 },
  dimActivo: { background: "#16a34a", color: "#fff", borderColor: "#16a34a" },
  kpis: { display: "flex", gap: 16, marginBottom: 16 },
  kpiBox: { display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 18px", minWidth: 180 },
  kpiLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" },
  kpiVal: { fontSize: 22, fontWeight: 900, color: "#0f172a" },
  error: { background: "#fef2f2", color: "#dc2626", padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 12 },
  tableContainer: { flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, overflowY: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { background: "#f1f5f9", color: "#475569", fontWeight: 700, padding: 10, textAlign: "left", borderBottom: "2px solid #cbd5e1" },
  td: { padding: 10, borderBottom: "1px solid #f1f5f9" },
  empty: { textAlign: "center", padding: 40, color: "#9ca3af" },
  chartBox: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: 8, padding: 20, overflowX: "auto" },
  chartArea: { display: "flex", alignItems: "flex-end", gap: 14, minWidth: "100%", height: 220 },
  barCol: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 50 },
  bar: { width: 28, background: "#1e3a8a", borderRadius: "4px 4px 0 0", minHeight: 2 },
  barVal: { fontSize: 9, color: "#475569", fontWeight: 700 },
  barLabel: { fontSize: 10, color: "#94a3b8", fontWeight: 600 },
};
