import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A"
);

export default function Login({ onLogin }) {
  const [usuarios, setUsuarios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadUsuarios = async () => {
    const { data } = await supabase.from("usuarios").select("id,nombre,rol").eq("activo", true).order("nombre");
    setUsuarios(data || []);
    setLoaded(true);
  };

  if (!loaded) loadUsuarios();

  const handlePin = (num) => {
    if (pin.length >= 4) return;
    setPin(prev => prev + num);
    setError("");
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handleLogin = async () => {
    if (!selected) { setError("Selecciona tu nombre primero"); return; }
    if (pin.length < 4) { setError("Ingresa tu PIN de 4 dígitos"); return; }
    setLoading(true);
    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", selected.id)
      .eq("pin", pin)
      .eq("activo", true)
      .single();
    setLoading(false);
    if (!data) { setError("PIN incorrecto"); setPin(""); return; }
    onLogin(data);
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logo}>🏪</div>
        <div style={s.title}>JardínBazar POS</div>
        <div style={s.subtitle}>¿Quién eres?</div>

        <div style={s.userList}>
          {usuarios.map(u => (
            <button key={u.id}
              style={{ ...s.userBtn, ...(selected?.id === u.id ? s.userBtnActive : {}) }}
              onClick={() => { setSelected(u); setPin(""); setError(""); }}>
              <span style={s.userAvatar}>{u.nombre[0].toUpperCase()}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{u.nombre}</div>
                <div style={{ fontSize: 10, color: selected?.id === u.id ? "#fff" : "#9ca3af", textTransform: "uppercase" }}>{u.rol}</div>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <>
            <div style={s.pinLabel}>PIN de {selected.nombre}</div>
            <div style={s.pinDots}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ ...s.pinDot, background: pin.length > i ? "#16a34a" : "#e5e7eb" }} />
              ))}
            </div>

            <div style={s.numpad}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((n, idx) => (
                <button key={idx}
                  style={{ ...s.numBtn, opacity: n === "" ? 0 : 1 }}
                  onClick={() => n === "⌫" ? handleDelete() : n !== "" ? handlePin(String(n)) : null}>
                  {n}
                </button>
              ))}
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button style={{ ...s.loginBtn, opacity: pin.length < 4 || loading ? 0.5 : 1 }}
              disabled={pin.length < 4 || loading}
              onClick={handleLogin}>
              {loading ? "Verificando..." : "Entrar →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { height: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" },
  card: { background: "#fff", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 360, boxShadow: "0 10px 40px #0001", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  logo: { fontSize: 48 },
  title: { fontWeight: 800, fontSize: 20, color: "#111827" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: -8 },
  userList: { width: "100%", display: "flex", flexDirection: "column", gap: 8 },
  userBtn: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all .15s" },
  userBtnActive: { background: "#16a34a", borderColor: "#16a34a", color: "#fff" },
  userAvatar: { width: 36, height: 36, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 },
  pinLabel: { fontSize: 13, color: "#6b7280", alignSelf: "flex-start" },
  pinDots: { display: "flex", gap: 12 },
  pinDot: { width: 16, height: 16, borderRadius: "50%", transition: "background .15s" },
  numpad: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%" },
  numBtn: { padding: "16px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 20, fontWeight: 700, cursor: "pointer", transition: "all .1s" },
  error: { background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "8px 14px", fontSize: 12, width: "100%", textAlign: "center" },
  loginBtn: { width: "100%", padding: 14, background: "#16a34a", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "opacity .15s" },
};
