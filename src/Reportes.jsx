import { useState, useEffect, useCallback } from "react";
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

function getDesde(tipo) {
  const ahora = new Date();
  if (tipo === "hoy") { const d = new Date(ahora); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  if (tipo === "semana") { const d = new Date(ahora); d.setDate(d.getDate() - 7); return d.toISOString(); }
  if (tipo === "mes") { const d = new Date(ahora); d.setDate(d.getDate() - 30); return d.toISOString(); }
  return null;
}

export default function Reportes() {
  const [rango, setRango] = useState("semana");
  const [ranking, setRanking] = useState([]);
  const [resumen, setResumen] = useState({ items: 0, ingresos: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const cargar = useCallback(async (tipo) => {
    setLoading(true);
    setErrorMsg("");
    const desde = getDesde(tipo);

    let q = supabase
      .from("detalle_ventas")
      .select("producto_id, producto_nombre, cantidad, subtotal, ventas!inner(fecha)");
    if (desde) q = q.gte("ventas.fecha", desde);

    const { data, error } = await q;

    if (error) {
      setErrorMsg("Error al cargar datos: " + error.message);
      setRanking([]);
      setLoading(false);
      return;
    }

    const map = new Map();
    let ingresosTotal = 0;
    (data || []).forEach((d) => {
      const key = d.producto_id || `n:${d.producto_nombre}`;
      if (!map.has(key)) map.set(key, { nombre: d.producto_nombre, cantidad: 0, total: 0 });
      const r = map.get(key);
      r.cantidad += Number(d.cantidad) || 0;
      r.total += Number(d.subtotal) || 0;
      ingresosTotal += Number(d.subtotal) || 0;
    });

    const lista = Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 20);
    setRanking(lista);
    setResumen({ items: lista.length, ingresos: ingresosTotal });
    setLoading(false);
  }, []);

  useEffect(() => { cargar(rango); }, [rango, cargar]);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2 style={s.title}>📊 Productos Más Vendidos</h2>
        <div style={s.rangos}>
          {RANGOS.map((r) => (
            <button key={r.key} style={{ ...s.rangoBtn, ...(rango === r.key ? s.rangoActivo : {}) }} onClick={() => setRango(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.kpis}>
        <div style={s.kpiBox}>
          <span style={s.kpiLabel}>Productos distintos vendidos</span>
          <span style={s.kpiVal}>{resumen.items}</span>
        </div>
        <div style={s.kpiBox}>
          <span style={s.kpiLabel}>Ingresos en el período</span>
          <span style={{ ...s.kpiVal, color: "#16a34a" }}>{fmt(resumen.ingresos)}</span>
        </div>
      </div>

      {errorMsg && <div style={s.error}>{errorMsg}</div>}

      <div style={s.tableContainer}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Producto</th>
              <th style={{ ...s.th, textAlign: "right" }}>Cantidad vendida</th>
              <th style={{ ...s.th, textAlign: "right" }}>Ingreso total</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="4" style={s.empty}>Cargando...</td></tr>
            )}
            {!loading && ranking.length === 0 && (
              <tr><td colSpan="4" style={s.empty}>Sin ventas en este período</td></tr>
            )}
            {!loading && ranking.map((r, idx) => (
              <tr key={idx}>
                <td style={s.td}>{idx + 1}</td>
                <td style={{ ...s.td, fontWeight: 600 }}>{r.nombre}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{r.cantidad}</td>
                <td style={{ ...s.td, textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  wrap: { flex: 1, display: "flex", flexDirection: "column", padding: 20, background: "#fff", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  rangos: { display: "flex", gap: 6 },
  rangoBtn: { padding: "6px 14px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700 },
  rangoActivo: { background: "#1e3a8a", color: "#fff", borderColor: "#1e3a8a" },
  kpis: { display: "flex", gap: 16, marginBottom: 16 },
  kpiBox: { display: "flex", flexDirection: "column", gap: 4, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 18px", minWidth: 200 },
  kpiLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" },
  kpiVal: { fontSize: 22, fontWeight: 900, color: "#0f172a" },
  error: { background: "#fef2f2", color: "#dc2626", padding: 10, borderRadius: 6, fontSize: 13, marginBottom: 12 },
  tableContainer: { flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, overflowY: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { background: "#f1f5f9", color: "#475569", fontWeight: 700, padding: 10, textAlign: "left", borderBottom: "2px solid #cbd5e1" },
  td: { padding: 10, borderBottom: "1px solid #f1f5f9" },
  empty: { textAlign: "center", padding: 40, color: "#9ca3af" },
};
