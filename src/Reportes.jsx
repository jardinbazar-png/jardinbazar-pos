import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://carcghqhciuqpjedomuw.supabase.co",
  "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ"
);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [tab, setTab] = useState("utilidad");
  const [datos, setDatos] = useState({ ventas: [], detalle: [], costos: [] });

  useEffect(() => {
    async function fetchData() {
      const [v, d, c] = await Promise.all([
        supabase.from("ventas").select("*"),
        supabase.from("detalle_ventas").select("*"),
        supabase.from("costos_productos").select("*")
      ]);
      setDatos({ ventas: v.data || [], detalle: d.data || [], costos: c.data || [] });
    }
    fetchData();
  }, []);

  // Preparar datos para utilidad
  const reporteUtilidad = useMemo(() => {
    return datos.detalle.map(item => {
      const subtotal = Number(item.subtotal) || 0;
      const costoUnidad = datos.costos.find(c => c.producto_id === item.producto_id)?.costo || 0;
      const costoTotal = costoUnidad * (Number(item.cantidad) || 1);
      return { 
        nombre: item.producto_nombre || "Sin nombre asignado", 
        vendido: subtotal, 
        costo: costoTotal, 
        ganancia: subtotal - costoTotal 
      };
    });
  }, [datos]);

  const btnStyle = (t) => ({
    padding: "10px 20px",
    background: tab === t ? "#1e293b" : "#ffffff",
    color: tab === t ? "#fff" : "#475569",
    border: tab === t ? "none" : "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: "12px",
    transition: "all 0.2s"
  });

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Navegación */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        {["ranking", "resumen", "costos", "utilidad"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={btnStyle(t)}>{t}</button>
        ))}
      </div>

      {/* Contenedor Unificado */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        
        {tab === "utilidad" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#64748b", borderBottom: "2px solid #f1f5f9" }}>
                <th style={{ padding: "15px", textAlign: "left" }}>Producto</th>
                <th style={{ padding: "15px", textAlign: "right" }}>Vendido</th>
                <th style={{ padding: "15px", textAlign: "right" }}>Costo</th>
                <th style={{ padding: "15px", textAlign: "right" }}>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {reporteUtilidad.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "15px" }}>{r.nombre}</td>
                  <td style={{ padding: "15px", textAlign: "right" }}>{fmt(r.vendido)}</td>
                  <td style={{ padding: "15px", textAlign: "right", color: "#64748b" }}>{fmt(r.costo)}</td>
                  <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: r.ganancia >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(r.ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab !== "utilidad" && (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <h3>Sección en desarrollo</h3>
            <p>La pestaña <b>{tab.toUpperCase()}</b> estará disponible próximamente con su reporte específico.</p>
          </div>
        )}
      </div>
    </div>
  );
}
