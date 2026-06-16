import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

const TIPOS = [
  { key: "caja_vecina", label: "Caja Vecina", icon: "💳" },
  { key: "bip", label: "BIP", icon: "🚌" },
  { key: "servipag", label: "Servipag", icon: "📠" },
  { key: "loto_kino", label: "Loto y Kino", icon: "🎰" },
  { key: "encomienda", label: "Encomiendas", icon: "📦" },
];

const PROVEEDORES_ENCOMIENDA = ["Chilexpress", "Starken", "BluExpress", "Correos de Chile", "Mercado Libre"];

const rangoFecha = (filtro) => {
  const hoy = new Date();
  if (filtro === "hoy") { const d = new Date(hoy); d.setHours(0,0,0,0); return d.toISOString(); }
  if (filtro === "semana") { const d = new Date(hoy); d.setDate(d.getDate() - 7); return d.toISOString(); }
  if (filtro === "mes") { const d = new Date(hoy); d.setDate(d.getDate() - 30); return d.toISOString(); }
  return null;
};

export default function ServiciosExternos({ usuario, isAdmin }) {
  const [tipo, setTipo] = useState("caja_vecina");
  const [proveedor, setProveedor] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [comisionEstimada, setComisionEstimada] = useState("0");
  const [comisionManual, setComisionManual] = useState(false);
  const [notas, setNotas] = useState("");

  const [transacciones, setTransacciones] = useState([]);
  const [reglas, setReglas] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState("hoy");
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [editandoReal, setEditandoReal] = useState(null);
  const [valorReal, setValorReal] = useState("");

  const cargarTransacciones = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("servicios_externos").select("*").order("fecha", { ascending: false });
    const desde = rangoFecha(filtroFecha);
    if (desde) q = q.gte("fecha", desde);
    const { data } = await q.limit(300);
    setTransacciones(data || []);
    setLoading(false);
  }, [filtroFecha]);

  const cargarReglas = useCallback(async () => {
    const { data } = await supabase.from("reglas_comision").select("*");
    setReglas(data || []);
  }, []);

  useEffect(() => { cargarTransacciones(); }, [cargarTransacciones]);
  useEffect(() => { cargarReglas(); }, [cargarReglas]);

  const buscarRegla = (t, p) => reglas.find(r => r.tipo_servicio === t && r.proveedor === (p || "")) || null;

  useEffect(() => {
    if (comisionManual) return;
    const m = parseFloat(monto) || 0;
    const regla = buscarRegla(tipo, proveedor);
    if (!regla) { setComisionEstimada("0"); return; }
    const valor = regla.tipo_calculo === "porcentaje" ? Math.round(m * regla.valor / 100) : regla.valor;
    setComisionEstimada(String(valor));
  }, [tipo, proveedor, monto, reglas, comisionManual]);

  const cambiarTipo = (t) => {
    setTipo(t);
    setProveedor(t === "encomienda" ? PROVEEDORES_ENCOMIENDA[0] : "");
    setComisionManual(false);
  };

  const registrar = async () => {
    const m = parseFloat(monto);
    if (!m || m <= 0) return;
    await supabase.from("servicios_externos").insert({
      tipo_servicio: tipo,
      proveedor: proveedor || "",
      monto_transaccion: m,
      comision_estimada: parseFloat(comisionEstimada) || 0,
      metodo_pago: metodoPago,
      usuario_nombre: usuario?.nombre || "",
      notas: notas || null,
    });
    setMonto(""); setNotas(""); setComisionManual(false); setMetodoPago("efectivo");
    cargarTransacciones();
  };

  const guardarComisionReal = async (id) => {
    const v = parseFloat(valorReal);
    if (isNaN(v)) return;
    await supabase.from("servicios_externos").update({ comision_real: v }).eq("id", id);
    setEditandoReal(null); setValorReal("");
    cargarTransacciones();
  };

  const guardarRegla = async (t, p, tipoCalculo, valor) => {
    await supabase.from("reglas_comision").upsert(
      { tipo_servicio: t, proveedor: p || "", tipo_calculo: tipoCalculo, valor: parseFloat(valor) || 0 },
      { onConflict: "tipo_servicio,proveedor" }
    );
    cargarReglas();
  };

  const totalCobrado = transacciones.reduce((s, t) => s + Number(t.monto_transaccion), 0);
  const totalEstimada = transacciones.reduce((s, t) => s + Number(t.comision_estimada || 0), 0);
  const totalReal = transacciones.reduce((s, t) => s + Number(t.comision_real || 0), 0);
  const conReal = transacciones.filter(t => t.comision_real !== null);
  const diferencia = totalReal - conReal.reduce((s, t) => s + Number(t.comision_estimada || 0), 0);
  const labelTipo = (k) => TIPOS.find(x => x.key === k)?.label || k;

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <h2 style={st.title}>Servicios Externos</h2>
        <select style={st.selectFiltro} value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}>
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Últimos 30 días</option>
          <option value="todo">Todo</option>
        </select>
      </div>

      <div style={st.kpiRow}>
        <div style={st.kpiCard}><span style={st.kpiLabel}>Total Cobrado</span><span style={st.kpiVal}>{fmt(totalCobrado)}</span></div>
        <div style={st.kpiCard}><span style={st.kpiLabel}>Comisión Estimada</span><span style={st.kpiVal}>{fmt(totalEstimada)}</span></div>
        <div style={st.kpiCard}><span style={st.kpiLabel}>Comisión Real</span><span style={st.kpiVal}>{fmt(totalReal)}</span></div>
        <div style={st.kpiCard}><span style={st.kpiLabel}>Diferencia</span><span style={{ ...st.kpiVal, color: diferencia >= 0 ? "#16a34a" : "#ef4444" }}>{fmt(diferencia)}</span></div>
      </div>

      <div style={st.body}>
        <div style={st.formPanel}>
          <div style={st.tipoTabs}>
            {TIPOS.map(t => (
              <button key={t.key} style={{ ...st.tipoBtn, ...(tipo === t.key ? st.tipoBtnActive : {}) }} onClick={() => cambiarTipo(t.key)}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {tipo === "encomienda" && (
            <div style={st.field}>
              <label style={st.label}>Empresa</label>
              <select style={st.input} value={proveedor} onChange={e => { setProveedor(e.target.value); setComisionManual(false); }}>
                {PROVEEDORES_ENCOMIENDA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          <div style={st.field}>
            <label style={st.label}>Monto Transacción</label>
            <input style={{ ...st.input, fontSize: 20, fontWeight: 800, color: "#1e3a8a" }} type="number" placeholder="$0" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>

          <div style={st.field}>
            <label style={st.label}>Comisión Estimada (editable)</label>
            <input style={st.input} type="number" value={comisionEstimada} onChange={e => { setComisionEstimada(e.target.value); setComisionManual(true); }} />
          </div>

          <div style={st.field}>
            <label style={st.label}>Método de Pago</label>
            <select style={st.input} value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div style={st.field}>
            <label style={st.label}>Notas (opcional)</label>
            <input style={st.input} type="text" placeholder="N° de orden, cliente, etc." value={notas} onChange={e => setNotas(e.target.value)} />
          </div>

          <button style={{ ...st.confirmBtn, opacity: !monto || parseFloat(monto) <= 0 ? 0.5 : 1 }} disabled={!monto || parseFloat(monto) <= 0} onClick={registrar}>
            Registrar Transacción
          </button>

          {isAdmin && (
            <button style={st.configBtn} onClick={() => setShowConfig(s => !s)}>
              {showConfig ? "Ocultar" : "Configurar"} Comisiones
            </button>
          )}
        </div>

        <div style={st.historyPanel}>
          <table className="servTable" style={st.table}>
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Proveedor</th><th style={{ textAlign: "right" }}>Monto</th>
                <th style={{ textAlign: "right" }}>Com. Estimada</th><th style={{ textAlign: "right" }}>Com. Real</th><th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.fecha).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{labelTipo(t.tipo_servicio)}</td>
                  <td>{t.proveedor || "—"}</td>
                  <td style={{ textAlign: "right" }}>{fmt(t.monto_transaccion)}</td>
                  <td style={{ textAlign: "right", color: "#64748b" }}>{fmt(t.comision_estimada)}</td>
                  <td style={{ textAlign: "right" }}>
                    {editandoReal === t.id ? (
                      <input autoFocus style={st.inlineInput} type="number" value={valorReal} onChange={e => setValorReal(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && guardarComisionReal(t.id)} onBlur={() => guardarComisionReal(t.id)} />
                    ) : (
                      <span style={{ cursor: "pointer", color: t.comision_real != null ? "#16a34a" : "#cbd5e1", fontWeight: 700 }}
                        onClick={() => { setEditandoReal(t.id); setValorReal(t.comision_real ?? t.comision_estimada ?? 0); }}>
                        {t.comision_real != null ? fmt(t.comision_real) : "Asignar"}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 11, color: "#94a3b8" }}>{t.usuario_nombre}</td>
                </tr>
              ))}
              {!loading && transacciones.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Sin transacciones en este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && showConfig && <ConfigComisiones reglas={reglas} guardarRegla={guardarRegla} />}
    </div>
  );
}

function ConfigComisiones({ reglas, guardarRegla }) {
  const filas = [
    { tipo: "caja_vecina", proveedor: "", label: "Caja Vecina" },
    { tipo: "bip", proveedor: "", label: "BIP" },
    { tipo: "servipag", proveedor: "", label: "Servipag" },
    { tipo: "loto_kino", proveedor: "", label: "Loto y Kino" },
    ...PROVEEDORES_ENCOMIENDA.map(p => ({ tipo: "encomienda", proveedor: p, label: `Encomienda — ${p}` })),
  ];

  return (
    <div style={st.configPanel}>
      <h3 style={st.configTitle}>Reglas de Comisión</h3>
      <table className="servTable" style={st.table}>
        <thead><tr><th>Servicio</th><th>Cálculo</th><th>Valor</th></tr></thead>
        <tbody>
          {filas.map(f => {
            const regla = reglas.find(r => r.tipo_servicio === f.tipo && r.proveedor === f.proveedor);
            return <FilaRegla key={f.tipo + f.proveedor} fila={f} regla={regla} guardarRegla={guardarRegla} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function FilaRegla({ fila, regla, guardarRegla }) {
  const [tipoCalculo, setTipoCalculo] = useState(regla?.tipo_calculo || "fijo");
  const [valor, setValor] = useState(regla?.valor ?? 0);

  return (
    <tr>
      <td>{fila.label}</td>
      <td>
        <select style={st.inlineInput} value={tipoCalculo} onChange={e => setTipoCalculo(e.target.value)}>
          <option value="fijo">Monto fijo</option>
          <option value="porcentaje">Porcentaje</option>
        </select>
      </td>
      <td style={{ display: "flex", gap: 6 }}>
        <input style={st.inlineInput} type="number" value={valor} onChange={e => setValor(e.target.value)} />
        <button style={st.saveSmallBtn} onClick={() => guardarRegla(fila.tipo, fila.proveedor, tipoCalculo, valor)}>Guardar</button>
      </td>
    </tr>
  );
}

const st = {
  wrap: { flex: 1, padding: 20, overflowY: "auto", background: "#f8fafc" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  selectFiltro: { border: "1px solid #cbd5e1", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#475569" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 },
  kpiCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 4 },
  kpiLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" },
  kpiVal: { fontSize: 18, fontWeight: 900, color: "#0f172a" },
  body: { display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 },
  formPanel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 2, alignSelf: "start" },
  tipoTabs: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 },
  tipoBtn: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", color: "#475569", fontSize: 12, fontWeight: 700, textAlign: "left" },
  tipoBtnActive: { background: "#eff6ff", borderColor: "#2563eb", color: "#2563eb" },
  field: { marginBottom: 10 },
  label: { fontSize: 11, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 },
  input: { width: "100%", border: "1px solid #cbd5e1", borderRadius: 6, padding: "9px 10px", fontSize: 13, fontWeight: 600, color: "#1e293b", outline: "none", background: "#f8fafc" },
  confirmBtn: { width: "100%", padding: 11, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, marginTop: 6 },
  configBtn: { width: "100%", padding: 9, background: "none", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 8 },
  historyPanel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  inlineInput: { width: 90, border: "1px solid #cbd5e1", borderRadius: 4, padding: "4px 6px", fontSize: 12, textAlign: "right" },
  configPanel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginTop: 16 },
  configTitle: { fontSize: 14, fontWeight: 800, marginBottom: 10, color: "#0f172a" },
  saveSmallBtn: { padding: "4px 10px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700 },
};

if (typeof document !== "undefined" && !document.getElementById("servext-style")) {
  const style = document.createElement("style");
  style.id = "servext-style";
  style.innerHTML = `
    .servTable th { background:#f1f5f9; color:#475569; font-weight:700; padding:10px; border-bottom:2px solid #cbd5e1; text-align:left; }
    .servTable td { padding:10px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
    .servTable tr:hover { background:#f8fafc; }
  `;
  document.head.appendChild(style);
}
