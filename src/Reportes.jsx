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
    background: tab === t ? "#1e293b" : "#f1f5f9",
    color: tab === t ? "#fff" : "#475569",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: "12px"
  });

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        {["ranking", "resumen", "costos", "utilidad"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={btnStyle(t)}>{t}</button>
        ))}
      </div>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        {/* Lógica mejorada para mostrar contenido en todas las pestañas */}
        {tab === "utilidad" && (
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
            <thead>
              <tr style={{ color: "#64748b", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Producto</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Vendido</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Costo</th>
                <th style={{ padding: "10px", textAlign: "right" }}>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {reporteUtilidad.map((r, i) => (
                <tr key={i} style={{ background: "#f8fafc", borderRadius: "8px" }}>
                  <td style={{ padding: "15px", borderRadius: "8px 0 0 8px", fontWeight: "500" }}>{r.nombre}</td>
                  <td style={{ padding: "15px", textAlign: "right" }}>{fmt(r.vendido)}</td>
                  <td style={{ padding: "15px", textAlign: "right", color: "#64748b" }}>{fmt(r.costo)}</td>
                  <td style={{ padding: "15px", textAlign: "right", borderRadius: "0 8px 8px 0", fontWeight: "bold", color: r.ganancia >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(r.ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "ranking" && <p>🏆 <b>Top productos:</b> Tienes {datos.detalle.length} registros analizados.</p>}
        {tab === "resumen" && <p>📋 <b>Resumen:</b> Total de {datos.ventas.length} ventas procesadas en el sistema.</p>}
        {tab === "costos" && (
          <div>
            <h3>🚚 Lista de costos registrados</h3>
            {datos.costos.map((c, i) => <p key={i}>Proveedor: {c.proveedor || "Desconocido"} | Costo: {fmt(c.costo)}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
