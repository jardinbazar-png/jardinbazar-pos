// JARDINBAZAR POS — Ventas.jsx (Etapa 6)
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);
const fmtDateTime = (iso) => new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const Ico = ({ path, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const I = {
  x:        "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ban:      "M18.364 5.636A9 9 0 1 1 5.636 18.364 9 9 0 0 1 18.364 5.636zM4.929 4.929l14.142 14.142",
  calendar: "M3 4h18v18H3V4zM16 2v4M8 2v4M3 10h18",
  cash:     "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  card:     "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 13h.01",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  warn:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  list:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

const METODOS = {
  efectivo:      { label: "Efectivo",      color: "#16a34a", bg: "#f0fdf4" },
  debito:        { label: "Débito",        color: "#2563eb", bg: "#eff6ff" },
  credito:       { label: "Crédito",       color: "#7c3aed", bg: "#f5f3ff" },
  transferencia: { label: "Transferencia", color: "#0891b2", bg: "#ecfeff" },
  fiado:         { label: "Fiado",         color: "#d97706", bg: "#fffbeb" },
};

function metodoPago(raw) {
  if (!raw) return { label: "—", color: "#6b7280", bg: "#f3f4f6", nombre: null };
  const base = raw.split("_fiado:")[0];
  const nombre = raw.includes("_fiado:") ? raw.split("_fiado:")[1] : null;
  const m = METODOS[base] || { label: base, color: "#6b7280", bg: "#f3f4f6" };
  return { ...m, nombre };
}

export default function Ventas({ usuario }) {
  const isAdmin = usuario?.rol === "admin";

  const hoy = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [filtroMetodo, setFiltroMetodo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("activas"); // activas | anuladas | todas
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null); // { venta, detalles }
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [anularModal, setAnularModal] = useState(null); // venta a anular
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [msg, setMsg] = useState(null); // { tipo: "ok"|"err", texto }

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    const desdeISO = `${desde}T00:00:00`;
    const hastaISO = `${hasta}T23:59:59`;
    let q = supabase
      .from("ventas")
      .select("*")
      .gte("created_at", desdeISO)
      .lte("created_at", hastaISO)
      .order("created_at", { ascending: false });

    if (filtroEstado === "activas")  q = q.eq("anulada", false);
    if (filtroEstado === "anuladas") q = q.eq("anulada", true);

    const { data, error } = await q;
    if (!error) setVentas(data || []);
    setLoading(false);
  }, [desde, hasta, filtroEstado]);

  useEffect(() => { cargarVentas(); }, [cargarVentas]);

  const verDetalle = async (venta) => {
    setDetalleLoading(true);
    setVentaDetalle({ venta, detalles: [] });
    const { data } = await supabase
      .from("detalle_ventas")
      .select("*")
      .eq("venta_id", venta.id)
      .order("id");
    setVentaDetalle({ venta, detalles: data || [] });
    setDetalleLoading(false);
  };

  const confirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) return;
    setAnulando(true);
    const { error } = await supabase
      .from("ventas")
      .update({
        anulada: true,
        motivo_anulacion: motivoAnulacion.trim(),
        anulada_por: usuario?.nombre || "Desconocido",
        anulada_en: new Date().toISOString(),
      })
      .eq("id", anularModal.id);

    if (error) {
      setMsg({ tipo: "err", texto: "Error al anular la venta." });
    } else {
      // Revertir stock si tiene detalles con producto_id
      const { data: detalles } = await supabase
        .from("detalle_ventas")
        .select("*")
        .eq("venta_id", anularModal.id);

      for (const d of detalles || []) {
        if (!d.producto_id) continue;
        const { data: prod } = await supabase
          .from("productos")
          .select("existencia")
          .eq("id", d.producto_id)
          .single();
        if (prod) {
          await supabase
            .from("productos")
            .update({ existencia: prod.existencia + d.cantidad })
            .eq("id", d.producto_id);
        }
      }

      setMsg({ tipo: "ok", texto: `Venta #${anularModal.id} anulada y stock revertido.` });
      setAnularModal(null);
      setMotivoAnulacion("");
      // Si el detalle abierto es la venta anulada, cerrarlo
      if (ventaDetalle?.venta?.id === anularModal.id) setVentaDetalle(null);
      cargarVentas();
    }
    setAnulando(false);
    setTimeout(() => setMsg(null), 3500);
  };

  // Filtro por método (client-side sobre lo ya cargado)
  const ventasFiltradas = ventas.filter(v => {
    if (filtroMetodo === "todos") return true;
    return (v.metodo_pago || "").startsWith(filtroMetodo);
  });

  // Resumen
  const totalActivas = ventasFiltradas.filter(v => !v.anulada).reduce((s, v) => s + (v.total || 0), 0);
  const countActivas = ventasFiltradas.filter(v => !v.anulada).length;
  const countAnuladas = ventasFiltradas.filter(v => v.anulada).length;

  return (
    <div style={s.root}>
      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Historial de Ventas</h2>
          <p style={s.sub}>Consulta, filtra y anula ventas por fecha</p>
        </div>
        <button style={s.refreshBtn} onClick={cargarVentas} title="Recargar">
          <Ico path={I.refresh} size={16} />
        </button>
      </div>

      {/* ── FILTROS ── */}
      <div style={s.filtros}>
        <div style={s.filtroGroup}>
          <label style={s.filtroLabel}>Desde</label>
          <input type="date" style={s.dateInput} value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div style={s.filtroGroup}>
          <label style={s.filtroLabel}>Hasta</label>
          <input type="date" style={s.dateInput} value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <div style={s.filtroGroup}>
          <label style={s.filtroLabel}>Método de pago</label>
          <select style={s.select} value={filtroMetodo} onChange={e => setFiltroMetodo(e.target.value)}>
            <option value="todos">Todos</option>
            {Object.entries(METODOS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div style={s.filtroGroup}>
          <label style={s.filtroLabel}>Estado</label>
          <div style={s.estadoTabs}>
            {[["activas", "Activas"], ["anuladas", "Anuladas"], ["todas", "Todas"]].map(([k, l]) => (
              <button key={k} style={{ ...s.estadoTab, ...(filtroEstado === k ? s.estadoTabActive : {}) }}
                onClick={() => setFiltroEstado(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RESUMEN ── */}
      <div style={s.resumen}>
        <div style={s.kpi}>
          <span style={s.kpiVal}>{countActivas}</span>
          <span style={s.kpiLabel}>Ventas activas</span>
        </div>
        <div style={s.kpiDivider} />
        <div style={s.kpi}>
          <span style={{ ...s.kpiVal, color: "#16a34a" }}>{fmt(totalActivas)}</span>
          <span style={s.kpiLabel}>Total cobrado</span>
        </div>
        <div style={s.kpiDivider} />
        <div style={s.kpi}>
          <span style={{ ...s.kpiVal, color: "#ef4444" }}>{countAnuladas}</span>
          <span style={s.kpiLabel}>Anuladas</span>
        </div>
      </div>

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={s.layout}>
        {/* LISTA */}
        <div style={s.lista}>
          {loading && <div style={s.center}>Cargando ventas...</div>}
          {!loading && ventasFiltradas.length === 0 && (
            <div style={s.empty}>
              <Ico path={I.list} size={32} />
              <p>No hay ventas en este período</p>
            </div>
          )}
          {!loading && ventasFiltradas.map(v => {
            const mp = metodoPago(v.metodo_pago);
            const activa = ventaDetalle?.venta?.id === v.id;
            return (
              <div key={v.id}
                style={{ ...s.ventaRow, ...(activa ? s.ventaRowActive : {}), ...(v.anulada ? s.ventaRowAnulada : {}) }}
                onClick={() => verDetalle(v)}>
                <div style={s.ventaLeft}>
                  <div style={s.ventaId}>#{v.id}</div>
                  <div style={s.ventaFecha}>{fmtDateTime(v.created_at)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...s.metodoBadge, color: mp.color, background: mp.bg }}>
                    {mp.label}{mp.nombre ? ` · ${mp.nombre}` : ""}
                  </span>
                  {v.anulada && <span style={s.anuladaBadge}><Ico path={I.ban} size={11} /> Anulada</span>}
                  <span style={s.ventaTotal}>{fmt(v.total)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* DETALLE */}
        {ventaDetalle && (
          <div style={s.detalle}>
            <div style={s.detalleHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Venta #{ventaDetalle.venta.id}</span>
              <button style={s.iconBtn} onClick={() => setVentaDetalle(null)}><Ico path={I.x} size={16} /></button>
            </div>

            <div style={s.detalleInfo}>
              <div style={s.infoRow}><span style={s.infoKey}>Fecha</span><span>{fmtDateTime(ventaDetalle.venta.created_at)}</span></div>
              <div style={s.infoRow}>
                <span style={s.infoKey}>Método</span>
                <span>{(() => { const mp = metodoPago(ventaDetalle.venta.metodo_pago); return `${mp.label}${mp.nombre ? ` — ${mp.nombre}` : ""}`; })()}</span>
              </div>
              <div style={s.infoRow}><span style={s.infoKey}>Total</span><span style={{ fontWeight: 800, color: "#16a34a", fontSize: 18 }}>{fmt(ventaDetalle.venta.total)}</span></div>
              {ventaDetalle.venta.anulada && (
                <>
                  <div style={s.anuladaAlert}>
                    <Ico path={I.warn} size={14} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Venta anulada</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>Motivo: {ventaDetalle.venta.motivo_anulacion}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>Por {ventaDetalle.venta.anulada_por} · {ventaDetalle.venta.anulada_en ? fmtDateTime(ventaDetalle.venta.anulada_en) : "—"}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={s.detalleTitle}>Productos</div>
            {detalleLoading && <div style={{ padding: 20, color: "#9ca3af", textAlign: "center" }}>Cargando...</div>}
            {!detalleLoading && ventaDetalle.detalles.length === 0 && (
              <div style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>Sin detalle de productos.</div>
            )}
            {!detalleLoading && ventaDetalle.detalles.map((d, i) => (
              <div key={i} style={s.detalleRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.nombre_producto}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{fmt(d.precio_unitario)} × {d.cantidad}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(d.subtotal)}</div>
              </div>
            ))}

            {/* Botón anular — solo admin, solo si no está anulada */}
            {isAdmin && !ventaDetalle.venta.anulada && (
              <button style={s.anularBtn} onClick={() => { setAnularModal(ventaDetalle.venta); setMotivoAnulacion(""); }}>
                <Ico path={I.ban} size={15} /> Anular esta venta
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL ANULACIÓN ── */}
      {anularModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && !anulando && setAnularModal(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Anular Venta #{anularModal.id}</span>
              <button style={s.iconBtn} onClick={() => setAnularModal(null)} disabled={anulando}><Ico path={I.x} size={18} /></button>
            </div>
            <div style={s.modalWarn}>
              <Ico path={I.warn} size={18} />
              <div>
                <div style={{ fontWeight: 700 }}>Esta acción revertirá el stock</div>
                <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>Los productos vuelven al inventario. No se puede deshacer.</div>
              </div>
            </div>
            <div style={{ marginBottom: 8, fontSize: 13 }}>
              <strong>Total a anular:</strong> {fmt(anularModal.total)}
            </div>
            <label style={{ fontSize: 12, color: "#374151", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Motivo de anulación *
            </label>
            <textarea
              style={s.textarea}
              rows={3}
              placeholder="Ej: Error de cobro, producto devuelto, pedido duplicado..."
              value={motivoAnulacion}
              onChange={e => setMotivoAnulacion(e.target.value)}
              autoFocus
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={s.cancelBtn} onClick={() => setAnularModal(null)} disabled={anulando}>Cancelar</button>
              <button
                style={{ ...s.confirmAnularBtn, opacity: !motivoAnulacion.trim() || anulando ? 0.4 : 1 }}
                disabled={!motivoAnulacion.trim() || anulando}
                onClick={confirmarAnulacion}>
                <Ico path={I.ban} size={16} /> {anulando ? "Anulando..." : "Confirmar anulación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLASH MSG ── */}
      {msg && (
        <div style={{ ...s.flash, background: msg.tipo === "ok" ? "#111827" : "#7f1d1d" }}>
          <Ico path={msg.tipo === "ok" ? I.check : I.warn} size={20} />
          <span>{msg.texto}</span>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { padding: 24, display: "flex", flexDirection: "column", gap: 16, height: "100%", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: 800, color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  refreshBtn: { background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center" },
  filtros: { display: "flex", gap: 16, flexWrap: "wrap", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, alignItems: "flex-end" },
  filtroGroup: { display: "flex", flexDirection: "column", gap: 4 },
  filtroLabel: { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" },
  dateInput: { border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", color: "#111827" },
  select: { border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", color: "#111827", background: "#fff" },
  estadoTabs: { display: "flex", gap: 4 },
  estadoTab: { padding: "8px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" },
  estadoTabActive: { background: "#111827", color: "#fff", borderColor: "#111827" },
  resumen: { display: "flex", gap: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  kpi: { flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 },
  kpiVal: { fontSize: 22, fontWeight: 800, color: "#111827" },
  kpiLabel: { fontSize: 11, color: "#6b7280", textTransform: "uppercase", fontWeight: 600 },
  kpiDivider: { width: 1, background: "#e5e7eb" },
  layout: { display: "flex", gap: 16, flex: 1, minHeight: 0 },
  lista: { flex: 1, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflowY: "auto", display: "flex", flexDirection: "column" },
  center: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", padding: 40 },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 10, padding: 60 },
  ventaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background .1s" },
  ventaRowActive: { background: "#eff6ff" },
  ventaRowAnulada: { opacity: 0.55 },
  ventaLeft: { display: "flex", flexDirection: "column", gap: 3 },
  ventaId: { fontSize: 13, fontWeight: 700, color: "#111827" },
  ventaFecha: { fontSize: 11, color: "#9ca3af" },
  ventaTotal: { fontSize: 15, fontWeight: 800, color: "#111827" },
  metodoBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  anuladaBadge: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", padding: "3px 10px", borderRadius: 20 },
  detalle: { width: 320, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" },
  detalleHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" },
  detalleInfo: { padding: 20, borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 10 },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 },
  infoKey: { color: "#6b7280", fontWeight: 600 },
  anuladaAlert: { display: "flex", gap: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, color: "#b91c1c", fontSize: 12, alignItems: "flex-start" },
  detalleTitle: { padding: "12px 20px 8px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #f3f4f6" },
  detalleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid #f9fafb" },
  anularBtn: { margin: 16, padding: "12px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, color: "#b91c1c", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  overlay: { position: "fixed", inset: 0, background: "#00000077", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 },
  modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 20px 60px #0004" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalWarn: { display: "flex", gap: 12, background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: 14, color: "#92400e", fontSize: 13, alignItems: "flex-start", marginBottom: 16 },
  textarea: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "Inter, sans-serif" },
  cancelBtn: { flex: 1, padding: 12, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#4b5563", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  confirmAnularBtn: { flex: 1, padding: 12, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" },
  iconBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer" },
  flash: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "14px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 10px 30px #0003", zIndex: 400 },
};
