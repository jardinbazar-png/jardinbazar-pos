import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

const fmt = n => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0);

const BILLETES = [20000, 10000, 5000, 2000, 1000, 500];
const MONEDAS = [500, 100, 50, 10];

export default function CierreCaja({ usuario }) {
  const hoy = new Date().toISOString().split("T")[0];
  const [ventas, setVentas] = useState([]);
  const [conteo, setConteo] = useState({});
  const [conteoMonedas, setConteoMonedas] = useState({});
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ventas")
        .select("*")
        .gte("created_at", hoy + "T00:00:00")
        .lte("created_at", hoy + "T23:59:59");
      setVentas(data || []);
    };
    load();
  }, [hoy]);

  const totalEfectivo = ventas.filter(v => v.metodo_pago === "efectivo").reduce((s, v) => s + v.total, 0);
  const totalDebito = ventas.filter(v => v.metodo_pago === "debito").reduce((s, v) => s + v.total, 0);
  const totalCredito = ventas.filter(v => v.metodo_pago === "credito").reduce((s, v) => s + v.total, 0);
  const totalTransferencia = ventas.filter(v => v.metodo_pago === "transferencia").reduce((s, v) => s + v.total, 0);
  const totalFiado = ventas.filter(v => v.metodo_pago?.includes("fiado")).reduce((s, v) => s + v.total, 0);
  const totalDia = ventas.reduce((s, v) => s + v.total, 0);

  const totalBilletes = BILLETES.reduce((s, b) => s + (parseInt(conteo[b] || 0) * b), 0);
  const totalMonedas = MONEDAS.reduce((s, m) => s + (parseInt(conteoMonedas[m] || 0) * m), 0);
  const totalContado = totalBilletes + totalMonedas;
  const esperado = parseFloat(efectivoInicial || 0) + totalEfectivo;
  const diferencia = totalContado - esperado;

  const guardar = async () => {
    setSaving(true);
    await supabase.from("caja_diaria").insert({
      fecha: hoy,
      efectivo_inicial: parseFloat(efectivoInicial || 0),
      total_ingresos: totalDia,
      efectivo_cierre: totalContado,
      cierre_contado: totalContado,
      cierre_esperado: esperado,
      diferencia,
    });
    setSaving(false);
    setGuardado(true);
  };

  return (
    <div style={s.wrap}>
      <div style={s.title}>💰 Cierre de Caja — {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</div>

      {/* RESUMEN VENTAS */}
      <div style={s.section}>📊 Resumen de ventas del día</div>
      <div style={s.grid4}>
        {[
          { label: "Efectivo", value: totalEfectivo, color: "#16a34a" },
          { label: "Débito", value: totalDebito, color: "#2563eb" },
          { label: "Crédito", value: totalCredito, color: "#9333ea" },
          { label: "Transferencia", value: totalTransferencia, color: "#0891b2" },
          { label: "Fiado", value: totalFiado, color: "#d97706" },
          { label: "TOTAL DÍA", value: totalDia, color: "#111827" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...s.kpi, borderColor: color + "33" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color }}>{fmt(value)}</div>
          </div>
        ))}
      </div>

      {/* EFECTIVO INICIAL */}
      <div style={s.section}>🏁 Efectivo inicial de caja</div>
      <input style={s.input} type="number" placeholder="¿Con cuánto abriste la caja hoy? ($)"
        value={efectivoInicial} onChange={e => setEfectivoInicial(e.target.value)} />

      {/* CONTEO BILLETES */}
      <div style={s.section}>💵 Conteo de billetes</div>
      <div style={s.conteoGrid}>
        {BILLETES.map(b => (
          <div key={b} style={s.conteoRow}>
            <span style={s.conteoLabel}>{fmt(b)}</span>
            <span style={s.conteoX}>×</span>
            <input style={s.conteoInput} type="number" min="0" placeholder="0"
              value={conteo[b] || ""} onChange={e => setConteo(p => ({ ...p, [b]: e.target.value }))} />
            <span style={s.conteoTotal}>{fmt(parseInt(conteo[b] || 0) * b)}</span>
          </div>
        ))}
      </div>

      {/* CONTEO MONEDAS */}
      <div style={s.section}>🪙 Conteo de monedas</div>
      <div style={s.conteoGrid}>
        {MONEDAS.map(m => (
          <div key={m} style={s.conteoRow}>
            <span style={s.conteoLabel}>{fmt(m)}</span>
            <span style={s.conteoX}>×</span>
            <input style={s.conteoInput} type="number" min="0" placeholder="0"
              value={conteoMonedas[m] || ""} onChange={e => setConteoMonedas(p => ({ ...p, [m]: e.target.value }))} />
            <span style={s.conteoTotal}>{fmt(parseInt(conteoMonedas[m] || 0) * m)}</span>
          </div>
        ))}
      </div>

      {/* CUADRATURA */}
      <div style={s.section}>⚖️ Cuadratura</div>
      <div style={s.cuadGrid}>
        <div style={s.cuadRow}><span>Total billetes</span><span>{fmt(totalBilletes)}</span></div>
        <div style={s.cuadRow}><span>Total monedas</span><span>{fmt(totalMonedas)}</span></div>
        <div style={s.cuadRow}><span style={{ fontWeight: 700 }}>Total contado</span><span style={{ fontWeight: 700 }}>{fmt(totalContado)}</span></div>
        <div style={s.cuadRow}><span>Efectivo inicial</span><span>{fmt(parseFloat(efectivoInicial || 0))}</span></div>
        <div style={s.cuadRow}><span>Ventas en efectivo</span><span>{fmt(totalEfectivo)}</span></div>
        <div style={s.cuadRow}><span style={{ fontWeight: 700 }}>Total esperado</span><span style={{ fontWeight: 700 }}>{fmt(esperado)}</span></div>
        <div style={{ ...s.cuadRow, borderTop: "2px solid #e5e7eb", paddingTop: 12, marginTop: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Diferencia</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: diferencia === 0 ? "#16a34a" : diferencia > 0 ? "#2563eb" : "#ef4444" }}>
            {diferencia > 0 ? "+" : ""}{fmt(diferencia)}
          </span>
        </div>
        {diferencia !== 0 && (
          <div style={{ fontSize: 12, color: diferencia > 0 ? "#2563eb" : "#ef4444", textAlign: "right" }}>
            {diferencia > 0 ? "Hay más dinero del esperado (sobrante)" : "Hay menos dinero del esperado (faltante)"}
          </div>
        )}
      </div>

      {!guardado ? (
        <button style={s.saveBtn} onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "✓ Guardar cierre de caja"}
        </button>
      ) : (
        <div style={s.success}>✓ Cierre guardado correctamente</div>
      )}
    </div>
  );
}

const s = {
  wrap: { flex: 1, overflowY: "auto", padding: 20, maxWidth: 700 },
  title: { fontWeight: 800, fontSize: 18, color: "#111827", marginBottom: 20 },
  section: { fontWeight: 700, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px", paddingTop: 16, borderTop: "1px solid #e5e7eb" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 },
  kpi: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 16px" },
  input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", fontSize: 16, color: "#111827", outline: "none", background: "#f9fafb" },
  conteoGrid: { display: "flex", flexDirection: "column", gap: 8 },
  conteoRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px" },
  conteoLabel: { width: 80, fontWeight: 700, color: "#374151", fontSize: 14 },
  conteoX: { color: "#9ca3af", fontSize: 16 },
  conteoInput: { width: 70, border: "1.5px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none", background: "#f9fafb" },
  conteoTotal: { marginLeft: "auto", fontWeight: 700, color: "#16a34a", fontSize: 14 },
  cuadGrid: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 },
  cuadRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "#374151" },
  saveBtn: { marginTop: 20, width: "100%", padding: 14, background: "#16a34a", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  success: { marginTop: 20, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 14, color: "#16a34a", fontWeight: 700, textAlign: "center" },
};
