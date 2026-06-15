import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

const fmt = n => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n || 0);

const BILLETES = [20000, 10000, 5000, 2000, 1000, 500];
const MONEDAS = [500, 100, 50, 10];
const TABS = ["resumen", "conteo", "gastos", "fiados", "cierre"];

export default function CierreCaja({ usuario }) {
  const hoy = new Date().toISOString().split("T")[0];
  const [tab, setTab] = useState("resumen");
  const [ventas, setVentas] = useState([]);
  const [conteo, setConteo] = useState({});
  const [conteoMonedas, setConteoMonedas] = useState({});
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [cajachica, setCajachica] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [saving, setSaving] = useState(false);

  // Retiros
  const [retiros, setRetiros] = useState([]);
  const [retiroMonto, setRetiroMonto] = useState("");
  const [retiroDesc, setRetiroDesc] = useState("");

  // Gastos
  const [gastos, setGastos] = useState([]);
  const [gastoMonto, setGastoMonto] = useState("");
  const [gastoDesc, setGastoDesc] = useState("");

  // Billetes falsos
  const [billetesFalsos, setBilletesFalsos] = useState([]);
  const [falsoDenominacion, setFalsoDenominacion] = useState(BILLETES[0]);
  const [falsoCantidad, setFalsoCantidad] = useState(1);

  // Descuadre
  const [motivoDescuadre, setMotivoDescuadre] = useState("");

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

  // Totales por método de pago
  const totalEfectivo = ventas.filter(v => v.metodo_pago === "efectivo").reduce((s, v) => s + v.total, 0);
  const totalDebito = ventas.filter(v => v.metodo_pago === "debito").reduce((s, v) => s + v.total, 0);
  const totalCredito = ventas.filter(v => v.metodo_pago === "credito").reduce((s, v) => s + v.total, 0);
  const totalTransferencia = ventas.filter(v => v.metodo_pago === "transferencia").reduce((s, v) => s + v.total, 0);
  const totalFiado = ventas.filter(v => v.metodo_pago?.includes("fiado")).reduce((s, v) => s + v.total, 0);
  const totalDia = ventas.reduce((s, v) => s + v.total, 0);

  const fiados = ventas.filter(v => v.metodo_pago?.includes("fiado")).map(v => ({
    nombre: v.metodo_pago.replace("efectivo_fiado:", "").replace("fiado:", "").replace(/^.*_fiado:/, ""),
    total: v.total,
    hora: new Date(v.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
  }));

  // Conteo físico
  const totalBilletes = BILLETES.reduce((s, b) => s + (parseInt(conteo[b] || 0) * b), 0);
  const totalMonedas = MONEDAS.reduce((s, m) => s + (parseInt(conteoMonedas[m] || 0) * m), 0);
  const totalContado = totalBilletes + totalMonedas;

  // Descuentos
  const totalRetiros = retiros.reduce((s, r) => s + r.monto, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const totalFalsos = billetesFalsos.reduce((s, f) => s + f.denominacion * f.cantidad, 0);
  const cajachicaVal = parseFloat(cajachica || 0);

  // Cuadratura
  const esperado = parseFloat(efectivoInicial || 0) + cajachicaVal + totalEfectivo - totalRetiros - totalGastos - totalFalsos;
  const diferencia = totalContado - esperado;

  const agregarRetiro = () => {
    if (!retiroMonto || parseFloat(retiroMonto) <= 0) return;
    setRetiros(p => [...p, { monto: parseFloat(retiroMonto), desc: retiroDesc || "Retiro de efectivo", id: Date.now() }]);
    setRetiroMonto(""); setRetiroDesc("");
  };

  const agregarGasto = () => {
    if (!gastoMonto || parseFloat(gastoMonto) <= 0) return;
    setGastos(p => [...p, { monto: parseFloat(gastoMonto), desc: gastoDesc || "Gasto sin descripción", id: Date.now() }]);
    setGastoMonto(""); setGastoDesc("");
  };

  const agregarFalso = () => {
    setBilletesFalsos(p => [...p, { denominacion: parseInt(falsoDenominacion), cantidad: parseInt(falsoCantidad), id: Date.now() }]);
    setFalsoCantidad(1);
  };

  const guardar = async () => {
    setSaving(true);
    await supabase.from("caja_diaria").insert({
      fecha: hoy,
      efectivo_inicial: parseFloat(efectivoInicial || 0),
      caja_chica: cajachicaVal,
      total_ingresos: totalDia,
      total_efectivo: totalEfectivo,
      total_debito: totalDebito,
      total_credito: totalCredito,
      total_transferencia: totalTransferencia,
      total_fiado: totalFiado,
      total_retiros: totalRetiros,
      total_gastos: totalGastos,
      billetes_falsos: totalFalsos,
      efectivo_cierre: totalContado,
      cierre_esperado: esperado,
      diferencia,
      motivo_descuadre: diferencia !== 0 ? motivoDescuadre : null,
      retiros: JSON.stringify(retiros),
      gastos: JSON.stringify(gastos),
      billetes_falsos_detalle: JSON.stringify(billetesFalsos),
    });
    setSaving(false);
    setGuardado(true);
  };

  const tabLabel = { resumen: "📊 Resumen", conteo: "💵 Conteo", gastos: "📋 Gastos", fiados: "🤝 Fiados", cierre: "⚖️ Cierre" };

  return (
    <div style={s.wrap}>
      <div style={s.title}>💰 Caja del Día — {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</div>

      {/* TABS */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tab === "resumen" && (
        <>
          <div style={s.section}>Ventas por método de pago</div>
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
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{ventas.filter(v => label === "Fiado" ? v.metodo_pago?.includes("fiado") : label === "TOTAL DÍA" ? true : v.metodo_pago === label.toLowerCase()).length} ventas</div>
              </div>
            ))}
          </div>

          <div style={s.section}>Resumen de descuentos del día</div>
          <div style={s.cuadGrid}>
            <div style={s.cuadRow}><span>Retiros de efectivo</span><span style={{ color: "#ef4444" }}>- {fmt(totalRetiros)}</span></div>
            <div style={s.cuadRow}><span>Gastos del día</span><span style={{ color: "#ef4444" }}>- {fmt(totalGastos)}</span></div>
            <div style={s.cuadRow}><span>Billetes falsos</span><span style={{ color: "#ef4444" }}>- {fmt(totalFalsos)}</span></div>
            <div style={{ ...s.cuadRow, borderTop: "2px solid #e5e7eb", paddingTop: 10, fontWeight: 800 }}>
              <span>Efectivo neto en caja</span>
              <span style={{ color: "#16a34a" }}>{fmt(totalEfectivo - totalRetiros - totalGastos - totalFalsos)}</span>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: CONTEO ── */}
      {tab === "conteo" && (
        <>
          <div style={s.section}>Efectivo inicial y caja chica</div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Efectivo inicial ($)</label>
              <input style={s.input} type="number" placeholder="¿Con cuánto abriste la caja?" value={efectivoInicial} onChange={e => setEfectivoInicial(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Caja chica / monedas de repuesto ($)</label>
              <input style={s.input} type="number" placeholder="Monedas de inicio" value={cajachica} onChange={e => setCajachica(e.target.value)} />
            </div>
          </div>

          <div style={s.section}>Billetes</div>
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

          <div style={s.section}>Monedas</div>
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

          <div style={{ ...s.cuadGrid, marginTop: 16 }}>
            <div style={s.cuadRow}><span>Total billetes</span><span style={{ fontWeight: 700 }}>{fmt(totalBilletes)}</span></div>
            <div style={s.cuadRow}><span>Total monedas</span><span style={{ fontWeight: 700 }}>{fmt(totalMonedas)}</span></div>
            <div style={{ ...s.cuadRow, borderTop: "2px solid #e5e7eb", paddingTop: 10, fontWeight: 800, fontSize: 16 }}>
              <span>Total contado</span><span style={{ color: "#16a34a" }}>{fmt(totalContado)}</span>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: GASTOS ── */}
      {tab === "gastos" && (
        <>
          {/* Retiros */}
          <div style={s.section}>Retiros de efectivo</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input style={{ ...s.input, flex: 1 }} type="number" placeholder="Monto ($)" value={retiroMonto} onChange={e => setRetiroMonto(e.target.value)} />
            <input style={{ ...s.input, flex: 2 }} type="text" placeholder="Descripción (ej: retiro para depósito)" value={retiroDesc} onChange={e => setRetiroDesc(e.target.value)} />
            <button style={s.addBtn} onClick={agregarRetiro}>+ Agregar</button>
          </div>
          {retiros.length === 0 && <div style={s.empty}>Sin retiros registrados</div>}
          {retiros.map(r => (
            <div key={r.id} style={s.listRow}>
              <span>{r.desc}</span>
              <span style={{ color: "#ef4444", fontWeight: 700 }}>- {fmt(r.monto)}</span>
              <button style={s.removeBtn} onClick={() => setRetiros(p => p.filter(x => x.id !== r.id))}>✕</button>
            </div>
          ))}
          {retiros.length > 0 && <div style={{ ...s.cuadRow, fontWeight: 800, marginTop: 8 }}><span>Total retiros</span><span style={{ color: "#ef4444" }}>- {fmt(totalRetiros)}</span></div>}

          {/* Gastos */}
          <div style={s.section}>Gastos del día (facturas, proveedores, etc.)</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input style={{ ...s.input, flex: 1 }} type="number" placeholder="Monto ($)" value={gastoMonto} onChange={e => setGastoMonto(e.target.value)} />
            <input style={{ ...s.input, flex: 2 }} type="text" placeholder="Descripción (ej: factura Carozzi)" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)} />
            <button style={s.addBtn} onClick={agregarGasto}>+ Agregar</button>
          </div>
          {gastos.length === 0 && <div style={s.empty}>Sin gastos registrados</div>}
          {gastos.map(g => (
            <div key={g.id} style={s.listRow}>
              <span>{g.desc}</span>
              <span style={{ color: "#ef4444", fontWeight: 700 }}>- {fmt(g.monto)}</span>
              <button style={s.removeBtn} onClick={() => setGastos(p => p.filter(x => x.id !== g.id))}>✕</button>
            </div>
          ))}
          {gastos.length > 0 && <div style={{ ...s.cuadRow, fontWeight: 800, marginTop: 8 }}><span>Total gastos</span><span style={{ color: "#ef4444" }}>- {fmt(totalGastos)}</span></div>}

          {/* Billetes falsos */}
          <div style={s.section}>Billetes falsos recibidos</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <select style={{ ...s.input, flex: 1 }} value={falsoDenominacion} onChange={e => setFalsoDenominacion(e.target.value)}>
              {BILLETES.map(b => <option key={b} value={b}>{fmt(b)}</option>)}
            </select>
            <input style={{ ...s.input, flex: 1, maxWidth: 80 }} type="number" min="1" value={falsoCantidad} onChange={e => setFalsoCantidad(e.target.value)} />
            <span style={{ color: "#6b7280", fontSize: 13 }}>billete(s)</span>
            <button style={{ ...s.addBtn, background: "#dc2626" }} onClick={agregarFalso}>+ Registrar</button>
          </div>
          {billetesFalsos.length === 0 && <div style={s.empty}>Sin billetes falsos registrados</div>}
          {billetesFalsos.map(f => (
            <div key={f.id} style={s.listRow}>
              <span>{f.cantidad} × {fmt(f.denominacion)}</span>
              <span style={{ color: "#ef4444", fontWeight: 700 }}>- {fmt(f.denominacion * f.cantidad)}</span>
              <button style={s.removeBtn} onClick={() => setBilletesFalsos(p => p.filter(x => x.id !== f.id))}>✕</button>
            </div>
          ))}
          {billetesFalsos.length > 0 && <div style={{ ...s.cuadRow, fontWeight: 800, marginTop: 8 }}><span>Total pérdida por falsos</span><span style={{ color: "#ef4444" }}>- {fmt(totalFalsos)}</span></div>}
        </>
      )}

      {/* ── TAB: FIADOS ── */}
      {tab === "fiados" && (
        <>
          <div style={s.section}>Créditos y fiados del día</div>
          {fiados.length === 0 && <div style={s.empty}>Sin ventas fiadas hoy</div>}
          {fiados.map((f, i) => (
            <div key={i} style={s.listRow}>
              <span style={{ fontWeight: 600 }}>{f.nombre || "Sin nombre"}</span>
              <span style={{ color: "#6b7280", fontSize: 12 }}>{f.hora}</span>
              <span style={{ color: "#d97706", fontWeight: 700, marginLeft: "auto" }}>{fmt(f.total)}</span>
            </div>
          ))}
          {fiados.length > 0 && (
            <div style={{ ...s.cuadGrid, marginTop: 12 }}>
              <div style={{ ...s.cuadRow, fontWeight: 800, fontSize: 15 }}>
                <span>Total fiado (pendiente de cobro)</span>
                <span style={{ color: "#d97706" }}>{fmt(totalFiado)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: CIERRE ── */}
      {tab === "cierre" && (
        <>
          <div style={s.section}>Cuadratura final</div>
          <div style={s.cuadGrid}>
            <div style={s.cuadRow}><span>Efectivo inicial</span><span>{fmt(parseFloat(efectivoInicial || 0))}</span></div>
            <div style={s.cuadRow}><span>Caja chica</span><span>{fmt(cajachicaVal)}</span></div>
            <div style={s.cuadRow}><span>Ventas en efectivo</span><span style={{ color: "#16a34a" }}>+ {fmt(totalEfectivo)}</span></div>
            <div style={s.cuadRow}><span>Retiros</span><span style={{ color: "#ef4444" }}>- {fmt(totalRetiros)}</span></div>
            <div style={s.cuadRow}><span>Gastos</span><span style={{ color: "#ef4444" }}>- {fmt(totalGastos)}</span></div>
            <div style={s.cuadRow}><span>Billetes falsos</span><span style={{ color: "#ef4444" }}>- {fmt(totalFalsos)}</span></div>
            <div style={{ ...s.cuadRow, borderTop: "2px solid #e5e7eb", paddingTop: 10, fontWeight: 700 }}>
              <span>Total esperado en caja</span><span>{fmt(esperado)}</span>
            </div>
            <div style={s.cuadRow}><span>Total contado físicamente</span><span style={{ fontWeight: 700 }}>{fmt(totalContado)}</span></div>
            <div style={{ ...s.cuadRow, borderTop: "2px solid #111827", paddingTop: 12, marginTop: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Diferencia</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: diferencia === 0 ? "#16a34a" : diferencia > 0 ? "#2563eb" : "#ef4444" }}>
                {diferencia > 0 ? "+" : ""}{fmt(diferencia)}
              </span>
            </div>
            {diferencia !== 0 && (
              <div style={{ fontSize: 12, color: diferencia > 0 ? "#2563eb" : "#ef4444", textAlign: "right" }}>
                {diferencia > 0 ? "Sobrante — hay más dinero del esperado" : "Faltante — hay menos dinero del esperado"}
              </div>
            )}
          </div>

          {diferencia !== 0 && (
            <>
              <div style={s.section}>Motivo del descuadre</div>
              <textarea style={{ ...s.input, minHeight: 80, resize: "vertical" }}
                placeholder="Explica la razón del descuadre (ej: vuelto equivocado, billete no registrado, etc.)"
                value={motivoDescuadre} onChange={e => setMotivoDescuadre(e.target.value)} />
            </>
          )}

          <div style={s.section}>Resumen completo</div>
          <div style={s.cuadGrid}>
            <div style={s.cuadRow}><span>Ventas totales del día</span><span style={{ fontWeight: 700 }}>{fmt(totalDia)}</span></div>
            <div style={s.cuadRow}><span style={{ color: "#6b7280" }}>Débito</span><span>{fmt(totalDebito)}</span></div>
            <div style={s.cuadRow}><span style={{ color: "#6b7280" }}>Crédito</span><span>{fmt(totalCredito)}</span></div>
            <div style={s.cuadRow}><span style={{ color: "#6b7280" }}>Transferencia</span><span>{fmt(totalTransferencia)}</span></div>
            <div style={s.cuadRow}><span style={{ color: "#d97706" }}>Fiado (por cobrar)</span><span style={{ color: "#d97706" }}>{fmt(totalFiado)}</span></div>
          </div>

          {!guardado ? (
            <button style={s.saveBtn} onClick={guardar} disabled={saving || (diferencia !== 0 && !motivoDescuadre)}>
              {saving ? "Guardando..." : diferencia !== 0 && !motivoDescuadre ? "Ingresa motivo del descuadre para guardar" : "✓ Guardar cierre de caja"}
            </button>
          ) : (
            <div style={s.success}>✓ Cierre guardado correctamente</div>
          )}
        </>
      )}
    </div>
  );
}

const s = {
  wrap: { flex: 1, overflowY: "auto", padding: 20, maxWidth: 760 },
  title: { fontWeight: 800, fontSize: 18, color: "#111827", marginBottom: 16 },
  tabs: { display: "flex", gap: 6, marginBottom: 20, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 },
  tab: { padding: "10px 18px", background: "none", border: "none", borderBottom: "2px solid transparent", marginBottom: -2, fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" },
  tabActive: { borderBottomColor: "#16a34a", color: "#16a34a" },
  section: { fontWeight: 700, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px", paddingTop: 16, borderTop: "1px solid #e5e7eb" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 },
  kpi: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 16px" },
  label: { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 },
  input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#111827", outline: "none", background: "#f9fafb", fontFamily: "inherit" },
  conteoGrid: { display: "flex", flexDirection: "column", gap: 8 },
  conteoRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px" },
  conteoLabel: { width: 80, fontWeight: 700, color: "#374151", fontSize: 14 },
  conteoX: { color: "#9ca3af", fontSize: 16 },
  conteoInput: { width: 70, border: "1.5px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none", background: "#f9fafb" },
  conteoTotal: { marginLeft: "auto", fontWeight: 700, color: "#16a34a", fontSize: 14 },
  cuadGrid: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 },
  cuadRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "#374151" },
  addBtn: { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  removeBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14, marginLeft: 8 },
  listRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", marginBottom: 6, fontSize: 14 },
  empty: { color: "#9ca3af", fontSize: 13, padding: "12px 0", fontStyle: "italic" },
  saveBtn: { marginTop: 20, width: "100%", padding: 14, background: "#16a34a", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  success: { marginTop: 20, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 14, color: "#16a34a", fontWeight: 700, textAlign: "center" },
};
