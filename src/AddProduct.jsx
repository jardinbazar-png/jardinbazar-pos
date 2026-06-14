import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

const DEPARTAMENTOS = ["Abarrotes","Bebidas","Snacks","Lácteos","Panadería","Aseo","Cafés","Tabaco","Carnes","Verduras","Frutas","Congelados","Licores","Mascotas","Otros"];
const TIPOS_VENTA = ["Unidad","Pieza","Gramo","Kilo","Litro","Paquete","Granel"];

const fmt = n => new Intl.NumberFormat("es-CL", { style:"currency", currency:"CLP" }).format(n||0);

export default function AddProduct({ onClose, onSaved, productToEdit }) {
  const isEdit = !!productToEdit;
  const codigoRef = useRef(null);

  const [form, setForm] = useState({
    codigo: productToEdit?.codigo || "",
    nombre: productToEdit?.nombre || "",
    tipo_venta: productToEdit?.tipo_venta || "Unidad",
    precio_costo_sin_iva: productToEdit?.precio_costo || 0,
    tiene_iva: productToEdit?.iva > 0 ?? true,
    porcentaje_ganancia: 30,
    precio_venta: productToEdit?.precio_venta || 0,
    precio_mayoreo: productToEdit?.precio_mayoreo || 0,
    departamento: productToEdit?.departamento || "",
    proveedor: productToEdit?.proveedor || "",
    usa_inventario: true,
    existencia: productToEdit?.existencia || 0,
    stock_minimo: productToEdit?.stock_minimo || 0,
    stock_maximo: productToEdit?.stock_maximo || 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Calcular precio venta automáticamente
      if (key === "precio_costo_sin_iva" || key === "porcentaje_ganancia" || key === "tiene_iva") {
        const costo = parseFloat(key === "precio_costo_sin_iva" ? val : next.precio_costo_sin_iva) || 0;
        const pct = parseFloat(key === "porcentaje_ganancia" ? val : next.porcentaje_ganancia) || 0;
        const iva = (key === "tiene_iva" ? val : next.tiene_iva) ? 1.19 : 1;
        const costoConIva = costo * iva;
        next.precio_venta = Math.round(costoConIva / (1 - pct / 100));
      }
      return next;
    });
  };

  const save = async () => {
    if (!form.codigo && !form.nombre) { setError("Ingresa al menos el código o nombre"); return; }
    setSaving(true);
    setError("");
    const data = {
      codigo: form.codigo || `GEN${Date.now()}`,
      nombre: form.nombre,
      tipo_venta: form.tipo_venta,
      precio_costo: parseFloat(form.precio_costo_sin_iva) || 0,
      precio_venta: parseFloat(form.precio_venta) || 0,
      precio_mayoreo: parseFloat(form.precio_mayoreo) || 0,
      departamento: form.departamento,
      proveedor: form.proveedor,
      existencia: parseInt(form.existencia) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 0,
      stock_maximo: parseInt(form.stock_maximo) || 0,
      iva: form.tiene_iva ? 19 : 0,
      activo: true,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("productos").update(data).eq("id", productToEdit.id));
    } else {
      ({ error } = await supabase.from("productos").insert(data));
    }

    setSaving(false);
    if (error) { setError("Error al guardar: " + error.message); return; }
    onSaved?.();
    onClose?.();
  };

  const inp = (label, key, type="text", opts={}) => (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <input
        style={s.input}
        type={type}
        value={form[key]}
        onChange={e => set(key, type==="number" ? e.target.value : e.target.value)}
        {...opts}
      />
    </div>
  );

  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose?.()}>
      <div style={s.modal}>
        <div style={s.header}>
          <span style={s.title}>{isEdit ? "Editar producto" : "Agregar producto nuevo"}</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          {/* CÓDIGO */}
          <div style={s.field}>
            <label style={s.label}>Código de barra <span style={s.hint}>(escanea o escribe)</span></label>
            <input
              ref={codigoRef}
              style={{ ...s.input, fontFamily:"monospace", fontSize:16 }}
              value={form.codigo}
              onChange={e => set("codigo", e.target.value)}
              placeholder="Escanea el código de barra aquí"
              autoFocus
            />
          </div>

          {inp("Descripción / Nombre del producto", "nombre")}

          {/* TIPO DE VENTA */}
          <div style={s.field}>
            <label style={s.label}>Tipo de venta</label>
            <div style={s.pills}>
              {TIPOS_VENTA.map(t => (
                <button key={t} style={{ ...s.pill, ...(form.tipo_venta===t ? s.pillActive : {}) }}
                  onClick={() => set("tipo_venta", t)}>{t}</button>
              ))}
            </div>
          </div>

          {/* PRECIOS */}
          <div style={s.section}>💰 Precios</div>
          <div style={s.row}>
            {inp("Costo sin IVA ($)", "precio_costo_sin_iva", "number")}
            <div style={s.field}>
              <label style={s.label}>¿Tiene IVA?</label>
              <div style={s.pills}>
                <button style={{ ...s.pill, ...(form.tiene_iva ? s.pillActive : {}) }} onClick={() => set("tiene_iva", true)}>Con IVA</button>
                <button style={{ ...s.pill, ...(!form.tiene_iva ? s.pillActive : {}) }} onClick={() => set("tiene_iva", false)}>Sin IVA</button>
              </div>
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>% Ganancia</label>
              <input style={s.input} type="number" value={form.porcentaje_ganancia}
                onChange={e => set("porcentaje_ganancia", e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Precio venta <span style={s.hint}>(calculado)</span></label>
              <div style={s.calcPrice}>{fmt(form.precio_venta)}</div>
            </div>
          </div>

          {inp("Precio mayoreo ($)", "precio_mayoreo", "number")}

          {/* DEPARTAMENTO Y PROVEEDOR */}
          <div style={s.section}>🏷️ Clasificación</div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Departamento</label>
              <select style={s.input} value={form.departamento} onChange={e => set("departamento", e.target.value)}>
                <option value="">Seleccionar...</option>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {inp("Proveedor", "proveedor")}
          </div>

          {/* INVENTARIO */}
          <div style={s.section}>📦 Inventario</div>
          <div style={s.field}>
            <label style={s.label}>¿Usa inventario?</label>
            <div style={s.pills}>
              <button style={{ ...s.pill, ...(form.usa_inventario ? s.pillActive : {}) }} onClick={() => set("usa_inventario", true)}>Sí</button>
              <button style={{ ...s.pill, ...(!form.usa_inventario ? s.pillActive : {}) }} onClick={() => set("usa_inventario", false)}>No</button>
            </div>
          </div>

          {form.usa_inventario && (
            <div style={s.row}>
              {inp("Stock actual", "existencia", "number")}
              {inp("Stock mínimo", "stock_minimo", "number")}
              {inp("Stock máximo", "stock_maximo", "number")}
            </div>
          )}

          {error && <div style={s.error}>{error}</div>}
        </div>

        <div style={s.footer}>
          <button style={s.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={s.saveBtn} onClick={save} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "✓ Guardar cambios" : "✓ Agregar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position:"fixed", inset:0, background:"#00000077", backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 },
  modal: { background:"#fff", borderRadius:16, width:"100%", maxWidth:560, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px #0004" },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:"1px solid #e5e7eb" },
  title: { fontWeight:800, fontSize:16, color:"#111827" },
  closeBtn: { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af" },
  body: { overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 },
  footer: { display:"flex", gap:10, padding:"16px 24px", borderTop:"1px solid #e5e7eb" },
  section: { fontWeight:700, fontSize:12, color:"#6b7280", textTransform:"uppercase", letterSpacing:1, paddingTop:8, borderTop:"1px solid #f3f4f6" },
  field: { display:"flex", flexDirection:"column", gap:5, flex:1 },
  row: { display:"flex", gap:12 },
  label: { fontSize:12, fontWeight:600, color:"#374151" },
  hint: { fontWeight:400, color:"#9ca3af" },
  input: { border:"1.5px solid #e5e7eb", borderRadius:8, padding:"10px 12px", fontSize:14, color:"#111827", outline:"none", background:"#f9fafb" },
  calcPrice: { border:"1.5px solid #16a34a", borderRadius:8, padding:"10px 12px", fontSize:16, fontWeight:800, color:"#16a34a", background:"#f0fdf4" },
  pills: { display:"flex", gap:6, flexWrap:"wrap" },
  pill: { padding:"6px 12px", borderRadius:20, border:"1.5px solid #e5e7eb", background:"#f9fafb", fontSize:12, fontWeight:600, color:"#6b7280", cursor:"pointer" },
  pillActive: { background:"#16a34a", borderColor:"#16a34a", color:"#fff" },
  cancelBtn: { flex:1, padding:13, background:"none", border:"1.5px solid #e5e7eb", borderRadius:8, color:"#6b7280", fontSize:14, fontWeight:600, cursor:"pointer" },
  saveBtn: { flex:2, padding:13, background:"#16a34a", border:"none", borderRadius:8, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" },
  error: { background:"#fee2e2", color:"#dc2626", borderRadius:8, padding:"10px 14px", fontSize:13 },
};
