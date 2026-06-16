// JARDINBAZAR POS — Ofertas.jsx (Etapa 6)
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

const fmt = n => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

const Ico = ({ path, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);
const I = {
  x:       "M18 6L6 18M6 6l12 12",
  check:   "M20 6L9 17l-5-5",
  plus:    "M12 5v14M5 12h14",
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  tag:     "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  trash:   "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  warn:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  zap:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
};

const TIPOS = [
  { key: "porcentaje", label: "% Descuento", desc: "Ej: 20% de descuento" },
  { key: "monto_fijo", label: "Monto fijo", desc: "Ej: $500 de descuento" },
  { key: "2x1",        label: "2×1",         desc: "Lleva 2 paga 1" },
  { key: "combo",      label: "Combo",        desc: "Precio especial al llevar varios productos" },
];

const TIPO_COLORS = {
  porcentaje: { bg: "#eff6ff", color: "#2563eb" },
  monto_fijo: { bg: "#f0fdf4", color: "#16a34a" },
  "2x1":      { bg: "#fdf4ff", color: "#9333ea" },
  combo:      { bg: "#fff7ed", color: "#ea580c" },
};

const emptyForm = {
  nombre: "", tipo: "porcentaje", valor: "", activa: true,
  fecha_inicio: "", fecha_fin: "", productos_ids: [],
};

export default function Ofertas({ products = [] }) {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [filtroActiva, setFiltroActiva] = useState("activas");
  const [prodQuery, setProdQuery] = useState("");

  const flash = (tipo, texto) => { setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 3000); };

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("ofertas").select("*").order("created_at", { ascending: false });
    setOfertas(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNueva = () => { setForm(emptyForm); setEditId(null); setShowForm(true); setProdQuery(""); };
  const abrirEditar = (o) => {
    setForm({ ...o, productos_ids: o.productos_ids || [], fecha_inicio: o.fecha_inicio || "", fecha_fin: o.fecha_fin || "" });
    setEditId(o.id); setShowForm(true); setProdQuery("");
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return flash("err", "Ingresa un nombre para la oferta.");
    if (form.tipo !== "2x1" && !form.valor) return flash("err", "Ingresa el valor del descuento.");
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      valor: parseFloat(form.valor || 0),
      activa: form.activa,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      productos_ids: form.productos_ids,
    };
    if (editId) {
      await supabase.from("ofertas").update(payload).eq("id", editId);
      flash("ok", "Oferta actualizada.");
    } else {
      await supabase.from("ofertas").insert(payload);
      flash("ok", "Oferta creada.");
    }
    setSaving(false);
    setShowForm(false);
    cargar();
  };

  const toggleActiva = async (o) => {
    await supabase.from("ofertas").update({ activa: !o.activa }).eq("id", o.id);
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta oferta?")) return;
    await supabase.from("ofertas").delete().eq("id", id);
    flash("ok", "Oferta eliminada.");
    cargar();
  };

  const toggleProducto = (id) => {
    setForm(f => ({
      ...f,
      productos_ids: f.productos_ids.includes(id)
        ? f.productos_ids.filter(x => x !== id)
        : [...f.productos_ids, id],
    }));
  };

  const filtradas = ofertas.filter(o =>
    filtroActiva === "activas" ? o.activa :
    filtroActiva === "inactivas" ? !o.activa : true
  );

  const prodFiltrados = products.filter(p =>
    !prodQuery || p.nombre.toLowerCase().includes(prodQuery.toLowerCase()) || p.codigo?.toString().includes(prodQuery)
  ).slice(0, 20);

  const hoy = new Date().toISOString().slice(0, 10);
  const vencida = (o) => o.fecha_fin && o.fecha_fin < hoy;

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Ofertas y Promociones</h2>
          <p style={s.sub}>Crea descuentos, 2×1 y combos aplicables al vender</p>
        </div>
        <button style={s.newBtn} onClick={abrirNueva}>
          <Ico path={I.plus} size={16} /> Nueva oferta
        </button>
      </div>

      {/* Tabs estado */}
      <div style={s.estadoTabs}>
        {[["activas", "Activas"], ["inactivas", "Inactivas"], ["todas", "Todas"]].map(([k, l]) => (
          <button key={k} style={{ ...s.estadoTab, ...(filtroActiva === k ? s.estadoTabActive : {}) }}
            onClick={() => setFiltroActiva(k)}>{l}</button>
        ))}
        <span style={s.count}>{filtradas.length} oferta{filtradas.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Lista */}
      {loading && <div style={s.center}>Cargando...</div>}
      {!loading && filtradas.length === 0 && (
        <div style={s.empty}>
          <Ico path={I.tag} size={32} />
          <p>No hay ofertas {filtroActiva !== "todas" ? filtroActiva : ""}</p>
          <button style={s.newBtn} onClick={abrirNueva}><Ico path={I.plus} size={14} /> Crear primera oferta</button>
        </div>
      )}
      <div style={s.grid}>
        {filtradas.map(o => {
          const tc = TIPO_COLORS[o.tipo] || { bg: "#f3f4f6", color: "#374151" };
          const tipoLabel = TIPOS.find(t => t.key === o.tipo)?.label || o.tipo;
          const prods = (o.productos_ids || []).map(id => products.find(p => p.id === id)?.nombre).filter(Boolean);
          return (
            <div key={o.id} style={{ ...s.card, opacity: o.activa ? 1 : 0.55 }}>
              <div style={s.cardTop}>
                <span style={{ ...s.tipoBadge, background: tc.bg, color: tc.color }}>{tipoLabel}</span>
                {vencida(o) && <span style={s.vencidaBadge}><Ico path={I.warn} size={11} /> Vencida</span>}
                <button style={{ ...s.toggleBtn, background: o.activa ? "#f0fdf4" : "#f3f4f6", color: o.activa ? "#16a34a" : "#6b7280" }}
                  onClick={() => toggleActiva(o)}>
                  {o.activa ? "Activa" : "Inactiva"}
                </button>
              </div>
              <div style={s.cardNombre}>{o.nombre}</div>
              <div style={s.cardValor}>
                {o.tipo === "porcentaje" && `${o.valor}% de descuento`}
                {o.tipo === "monto_fijo" && `${fmt(o.valor)} de descuento`}
                {o.tipo === "2x1" && "Lleva 2, paga 1"}
                {o.tipo === "combo" && `Precio combo: ${fmt(o.valor)}`}
              </div>
              {prods.length > 0 && (
                <div style={s.cardProds}>
                  {prods.slice(0, 3).map((n, i) => <span key={i} style={s.prodChip}>{n}</span>)}
                  {prods.length > 3 && <span style={s.prodChip}>+{prods.length - 3}</span>}
                </div>
              )}
              {(o.fecha_inicio || o.fecha_fin) && (
                <div style={s.cardFechas}>
                  {o.fecha_inicio && `Desde ${new Date(o.fecha_inicio + "T12:00:00").toLocaleDateString("es-CL")}`}
                  {o.fecha_inicio && o.fecha_fin && " · "}
                  {o.fecha_fin && `Hasta ${new Date(o.fecha_fin + "T12:00:00").toLocaleDateString("es-CL")}`}
                </div>
              )}
              <div style={s.cardActions}>
                <button style={s.actionBtn} onClick={() => abrirEditar(o)}><Ico path={I.edit} size={13} /> Editar</button>
                <button style={{ ...s.actionBtn, color: "#ef4444" }} onClick={() => eliminar(o.id)}><Ico path={I.trash} size={13} /> Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{editId ? "Editar oferta" : "Nueva oferta"}</span>
              <button style={s.iconBtn} onClick={() => setShowForm(false)}><Ico path={I.x} size={18} /></button>
            </div>

            <div style={s.formScroll}>
              {/* Tipo */}
              <label style={s.label}>Tipo de oferta</label>
              <div style={s.tipoGrid}>
                {TIPOS.map(t => (
                  <button key={t.key}
                    style={{ ...s.tipoBtn, ...(form.tipo === t.key ? s.tipoBtnActive : {}) }}
                    onClick={() => setForm(f => ({ ...f, tipo: t.key }))}>
                    <span style={{ fontWeight: 700 }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{t.desc}</span>
                  </button>
                ))}
              </div>

              {/* Nombre */}
              <label style={s.label}>Nombre de la oferta *</label>
              <input style={s.input} placeholder="Ej: Descuento fin de semana, 2x1 bebidas..."
                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />

              {/* Valor */}
              {form.tipo !== "2x1" && (
                <>
                  <label style={s.label}>{form.tipo === "porcentaje" ? "Porcentaje (%)" : "Monto ($)"}</label>
                  <input style={s.input} type="number" min="0"
                    placeholder={form.tipo === "porcentaje" ? "Ej: 20" : "Ej: 500"}
                    value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
                </>
              )}

              {/* Fechas */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Desde (opcional)</label>
                  <input style={s.input} type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Hasta (opcional)</label>
                  <input style={s.input} type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
                </div>
              </div>

              {/* Productos asociados */}
              <label style={s.label}>Productos asociados (opcional)</label>
              <div style={s.searchBox}>
                <Ico path={I.search} size={14} />
                <input style={s.searchInput} placeholder="Busca productos para asociar..."
                  value={prodQuery} onChange={e => setProdQuery(e.target.value)} />
              </div>
              {form.productos_ids.length > 0 && (
                <div style={s.seleccionados}>
                  {form.productos_ids.map(id => {
                    const p = products.find(x => x.id === id);
                    return p ? (
                      <span key={id} style={s.selChip}>
                        {p.nombre}
                        <button style={s.chipX} onClick={() => toggleProducto(id)}>×</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {prodQuery && (
                <div style={s.dropdown}>
                  {prodFiltrados.map(p => (
                    <button key={p.id} style={{ ...s.dropItem, background: form.productos_ids.includes(p.id) ? "#f0fdf4" : "#fff" }}
                      onClick={() => toggleProducto(p.id)}>
                      <span>{p.nombre}</span>
                      {form.productos_ids.includes(p.id) && <Ico path={I.check} size={14} />}
                    </button>
                  ))}
                  {prodFiltrados.length === 0 && <div style={{ padding: 12, color: "#9ca3af", fontSize: 13 }}>Sin resultados</div>}
                </div>
              )}

              {/* Estado */}
              <div style={s.switchRow}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Oferta activa</span>
                <button style={{ ...s.switch, background: form.activa ? "#16a34a" : "#e5e7eb" }}
                  onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}>
                  <span style={{ ...s.switchKnob, transform: form.activa ? "translateX(20px)" : "translateX(2px)" }} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
              <button style={{ ...s.confirmBtn, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={guardar}>
                <Ico path={I.check} size={16} /> {saving ? "Guardando..." : editId ? "Actualizar" : "Crear oferta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{ ...s.flash, background: msg.tipo === "ok" ? "#111827" : "#7f1d1d" }}>
          <Ico path={msg.tipo === "ok" ? I.check : I.warn} size={18} />
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
  newBtn: { display: "flex", alignItems: "center", gap: 8, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  estadoTabs: { display: "flex", gap: 6, alignItems: "center" },
  estadoTab: { padding: "8px 16px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" },
  estadoTabActive: { background: "#111827", color: "#fff", borderColor: "#111827" },
  count: { marginLeft: "auto", fontSize: 12, color: "#9ca3af" },
  center: { textAlign: "center", color: "#9ca3af", padding: 40 },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 60, color: "#9ca3af" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  card: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 8 },
  cardTop: { display: "flex", alignItems: "center", gap: 8 },
  tipoBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  vencidaBadge: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2", padding: "3px 10px", borderRadius: 20 },
  toggleBtn: { marginLeft: "auto", border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  cardNombre: { fontSize: 15, fontWeight: 800, color: "#111827" },
  cardValor: { fontSize: 13, color: "#374151" },
  cardProds: { display: "flex", flexWrap: "wrap", gap: 4 },
  prodChip: { background: "#f3f4f6", color: "#374151", fontSize: 11, padding: "2px 8px", borderRadius: 4 },
  cardFechas: { fontSize: 11, color: "#9ca3af" },
  cardActions: { display: "flex", gap: 8, marginTop: 4, paddingTop: 10, borderTop: "1px solid #f3f4f6" },
  actionBtn: { display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 8px" },
  overlay: { position: "fixed", inset: 0, background: "#00000077", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 },
  modal: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 20px 60px #0004", maxHeight: "90vh", display: "flex", flexDirection: "column" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  formScroll: { overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 },
  label: { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 },
  input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", background: "#f9fafb", fontFamily: "inherit", color: "#111827" },
  tipoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 },
  tipoBtn: { display: "flex", flexDirection: "column", gap: 2, padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", cursor: "pointer", textAlign: "left" },
  tipoBtnActive: { borderColor: "#16a34a", background: "#f0fdf4" },
  searchBox: { display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0 12px", height: 40 },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 13, background: "transparent", color: "#111827" },
  seleccionados: { display: "flex", flexWrap: "wrap", gap: 6 },
  selChip: { display: "flex", alignItems: "center", gap: 4, background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a", fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 600 },
  chipX: { background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 },
  dropdown: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px #0002", maxHeight: 200, overflowY: "auto" },
  dropItem: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontSize: 13, textAlign: "left" },
  switchRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" },
  switch: { width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background .2s" },
  switchKnob: { position: "absolute", top: 2, width: 20, height: 20, background: "#fff", borderRadius: "50%", transition: "transform .2s", display: "block" },
  cancelBtn: { flex: 1, padding: 12, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#4b5563", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: 12, background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" },
  iconBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer" },
  flash: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "14px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 14, boxShadow: "0 10px 30px #0003", zIndex: 400 },
};
