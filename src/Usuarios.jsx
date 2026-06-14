import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", pin: "", rol: "cajero" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await supabase.from("usuarios").select("*").order("nombre");
    setUsuarios(data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nombre) { setError("Ingresa un nombre"); return; }
    if (form.pin.length !== 4 || isNaN(form.pin)) { setError("El PIN debe ser de 4 números"); return; }
    setSaving(true);
    const { error: err } = await supabase.from("usuarios").insert({
      nombre: form.nombre,
      pin: form.pin,
      rol: form.rol,
      activo: true,
    });
    setSaving(false);
    if (err) { setError("Error: " + err.message); return; }
    setForm({ nombre: "", pin: "", rol: "cajero" });
    setShowForm(false);
    setError("");
    load();
  };

  const toggleActivo = async (u) => {
    await supabase.from("usuarios").update({ activo: !u.activo }).eq("id", u.id);
    load();
  };

  const cambiarRol = async (u) => {
    const nuevoRol = u.rol === "admin" ? "cajero" : "admin";
    await supabase.from("usuarios").update({ rol: nuevoRol }).eq("id", u.id);
    load();
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <div style={s.title}>👥 Usuarios del sistema</div>
          <div style={s.subtitle}>Solo los admins pueden ver esta pantalla</div>
        </div>
        <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Agregar usuario</button>
      </div>

      <div style={s.list}>
        {usuarios.map(u => (
          <div key={u.id} style={{ ...s.userCard, opacity: u.activo ? 1 : 0.5 }}>
            <div style={s.avatar}>{u.nombre[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={s.userName}>{u.nombre}</div>
              <div style={s.userMeta}>PIN: {"●".repeat(4)} · Creado: {new Date(u.creado_at).toLocaleDateString("es-CL")}</div>
            </div>
            <span style={{ ...s.rolBadge, background: u.rol === "admin" ? "#eff6ff" : "#f0fdf4", color: u.rol === "admin" ? "#2563eb" : "#16a34a" }}>
              {u.rol}
            </span>
            <div style={s.actions}>
              <button style={s.actionBtn} onClick={() => cambiarRol(u)}>
                {u.rol === "admin" ? "→ Cajero" : "→ Admin"}
              </button>
              <button style={{ ...s.actionBtn, color: u.activo ? "#ef4444" : "#16a34a" }} onClick={() => toggleActivo(u)}>
                {u.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Agregar usuario</span>
              <button style={s.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div style={s.field}>
              <label style={s.label}>Nombre</label>
              <input style={s.input} placeholder="Ej: María" value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} autoFocus />
            </div>

            <div style={s.field}>
              <label style={s.label}>PIN (4 números)</label>
              <input style={s.input} type="number" placeholder="Ej: 1234" maxLength={4}
                value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.slice(0, 4) }))} />
            </div>

            <div style={s.field}>
              <label style={s.label}>Rol</label>
              <div style={s.pills}>
                <button style={{ ...s.pill, ...(form.rol === "cajero" ? s.pillActive : {}) }}
                  onClick={() => setForm(p => ({ ...p, rol: "cajero" }))}>Cajero</button>
                <button style={{ ...s.pill, ...(form.rol === "admin" ? s.pillActive : {}) }}
                  onClick={() => setForm(p => ({ ...p, rol: "admin" }))}>Admin</button>
              </div>
            </div>

            {error && <div style={s.error}>{error}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
              <button style={s.saveBtn} onClick={save} disabled={saving}>
                {saving ? "Guardando..." : "✓ Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { flex: 1, overflowY: "auto", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontWeight: 800, fontSize: 18, color: "#111827" },
  subtitle: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  addBtn: { padding: "10px 16px", background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  userCard: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" },
  avatar: { width: 44, height: 44, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#374151", flexShrink: 0 },
  userName: { fontWeight: 700, fontSize: 14, color: "#111827" },
  userMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  rolBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 },
  actions: { display: "flex", gap: 8 },
  actionBtn: { padding: "6px 12px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" },
  overlay: { position: "fixed", inset: 0, background: "#00000066", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px #0003", display: "flex", flexDirection: "column", gap: 14 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: "#374151" },
  input: { border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#111827", outline: "none", background: "#f9fafb" },
  pills: { display: "flex", gap: 8 },
  pill: { flex: 1, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer" },
  pillActive: { background: "#16a34a", borderColor: "#16a34a", color: "#fff" },
  error: { background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "8px 14px", fontSize: 12 },
  cancelBtn: { flex: 1, padding: 12, background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  saveBtn: { flex: 2, padding: 12, background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" },
};
