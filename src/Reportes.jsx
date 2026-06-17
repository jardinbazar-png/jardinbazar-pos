import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [tab, setTab] = useState("utilidad");
  const [datos, setDatos] = useState({ ventas: [], detalle: [], costos: [] });

  useEffect(() => {
    async function fetchData() {
      // Pedimos todo con "*" para evitar errores de nombres de columnas
      const [v, d, c] = await Promise.all([
        supabase.from("ventas").select("*"),
        supabase.from("detalle_ventas").select("*"),
        supabase.from("costos_productos").select("*")
      ]);
      setDatos({ 
        ventas: v.data || [], 
        detalle: d.data || [], 
        costos: c.data || [] 
      });
    }
    fetchData();
  }, []);

  const reporte = useMemo(() => {
    // Si la tabla de costos tiene algo, usamos el primer costo encontrado como fallback
    const costoDefault = datos.costos.length > 0 ? Number(datos.costos[0].costo) : 0;
    
    return datos.detalle.map(item => {
      const subtotal = Number(item.subtotal) || 0;
      // Usamos el costo por unidad si existe, sino el default
      const costoUnidad = datos.costos.find(c => c.producto_id === item.producto_id)?.costo || costoDefault;
      const costoTotal = costoUnidad * (Number(item.cantidad) || 1);
      
      return {
        nombre: item.producto_nombre || "Producto sin nombre",
        vendido: subtotal,
        costo: costoTotal,
        ganancia: subtotal - costoTotal
      };
    });
  }, [datos]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["ranking", "resumen", "costos", "utilidad"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ textTransform: "uppercase", padding: "8px 15px", background: tab === t ? "#0f172a" : "#e2e8f0", color: tab === t ? "#fff" : "#000", border: "none", borderRadius: 5 }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "utilidad" && (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: 10, textAlign: "left" }}>Producto</th>
              <th style={{ padding: 10, textAlign: "right" }}>Vendido</th>
              <th style={{ padding: 10, textAlign: "right" }}>Costo</th>
              <th style={{ padding: 10, textAlign: "right" }}>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {reporte.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 10 }}>{r.nombre}</td>
                <td style={{ padding: 10, textAlign: "right" }}>{fmt(r.vendido)}</td>
                <td style={{ padding: 10, textAlign: "right", color: "#ef4444" }}>{fmt(r.costo)}</td>
                <td style={{ padding: 10, textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>{fmt(r.ganancia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
