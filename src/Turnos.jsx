import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

const fmtHora = (iso) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
const fmtFecha = (iso) => new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "long" });

export default function Turnos({ usuario }) {
  const [turnos, setTurnos] = useState([]);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const hoy = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("turnos")
      .select("*")
      .gte("entrada", hoy + "T00:00:00")
      .order("entrada", { ascending: false });
    setTurnos(data || []);
    const activo = (data || []).find(t => t.usuario_id === usuario.id && !t.salida);
    setTurnoActivo(activo || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const marcarEntrada = async () => {
    await supabase.from("turnos").insert({
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre,
      entrada: new Date().toISOString(),
    });
    load();
  };

  const marcarSalida = async () => {
    if (!turnoActivo) return;
    await supabase.from("turnos").update({ salida: new Date().toISOString() }).eq("id", turnoActivo.id);
    load();
  };

  const duracion = (entrada, salida) => {
    const diff = new Date(salida || new Date()) - new Date(entrada);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div style={s.wrap}>
      <div style={s.title}>🕐 Marcaje de Personal</div>

      {/* Estado actual */}
      <div style={{ ...s.statusCard, borderColor: turnoActivo ? "#16a34a" : "#e5e7eb", background: turnoActivo ? "#f0fdf4" : "#f9fafb" }}>
        <div style={{ fontSize: 32 }}>{turnoActivo ? "🟢" : "⚪"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
            {turnoActivo ? `Turno activo desde las ${fmtHora(turnoActivo.entrada)}` : "Sin turno activo"}
          </div>
          {turnoActivo && (
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Tiempo transcurrido: {duracion(turnoActivo.entrada, null)}
            </div>
          )}
        </div>
        {!turnoActivo ? (
          <button style={s.entradaBtn} onClick={marcarEntrada}>▶ Marcar entrada</button>
        ) : (
          <button style={s.salidaBtn} onClick={marcarSalida}>⏹ Marcar salida</button>
        )}
      </div>

      {/* Historial del día */}
      <div style={s.section}>📋 Turnos de hoy</div>
      {loading ? (
        <div style={s.center}>Cargando...</div>
      ) : turnos.length === 0 ? (
        <div style={s.empty}>No hay turnos registrados hoy</div>
      ) : (
        <div style={s.list}>
          {turnos.map(t => (
            <div key={t.id} style={s.turnoCard}>
              <div style={s.turnoAvatar}>{t.usuario_nombre[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{t.usuario_nombre}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  Entrada: {fmtHora(t.entrada)} {t.salida ? `· Salida: ${fmtHora(t.salida)}` : "· En turno"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.salida ? "#374151" : "#16a34a" }}>
                  {duracion(t.entrada, t.salida)}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{t.salida ? "Completado" : "Activo"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { flex: 1, overflowY: "auto", padding: 20, maxWidth: 600 },
  title: { fontWeight: 800, fontSize: 18, color: "#111827", marginBottom: 20 },
  statusCard: { display: "flex", alignItems: "center", gap: 16, background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 24 },
  entradaBtn: { padding: "10px 18px", background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 },
  salidaBtn: { padding: "10px 18px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 },
  section: { fontWeight: 700, fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  turnoCard: { display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" },
  turnoAvatar: { width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#374151", flexShrink: 0 },
  center: { textAlign: "center", color: "#9ca3af", padding: 40 },
  empty: { textAlign: "center", color: "#d1d5db", padding: 40, fontSize: 14 },
};
