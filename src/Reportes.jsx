import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [tab, setTab] = useState("utilidad");
  const [detalle, setDetalle] = useState([]);
  const [costos, setCostos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [d, c] = await Promise.all([
        supabase.from("detalle_ventas").select("producto_id, producto_nombre, cantidad, subtotal"),
        supabase.from("costos_productos").select("producto_id, costo")
      ]);
      setDetalle(d.data || []);
      setCostos(c.data || []);
    }
    fetchData();
  }, []);

  const dataUtilidad = useMemo(() => {
    const mapa = new Map();
    const costosMap = new Map();
    costos.forEach(c => { if(c.producto_id) costosMap.set(c.producto_id, Number(c.costo)); });

    detalle.forEach(d => {
      const id = d.producto_id;
      const costoU = costosMap.get(id) || 0;
      
      if (!mapa.has(id)) mapa.set(id, { nombre: d.producto_nombre, vendido: 0, costo: 0 });
      const r = mapa.get(id);
      r.vendido += Number(d.subtotal) || 0;
      r.costo += (costoU * (Number(d.cantidad) || 0));
    });
    
    return Array.from(mapa.values()).map(r => ({
      ...r,
      ganancia: r.vendido - r.costo
    })).sort((a, b) => b.ganancia - a.ganancia);
  }, [detalle, costos]);

  return (
    <div style={{ padding: 20 }}>
      {/* Pestañas simplificadas */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["ranking", "resumen", "costos", "utilidad"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 15px", background: tab === t ? "#0f172a" : "#e2e8f0", color: tab === t ? "#fff" : "#000", border: "none", borderRadius: 5 }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "utilidad" && (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: 10, textAlign: "left" }}>Producto</th>
              <th style={{ padding: 10, textAlign: "right" }}>Vendido</th>
              <th style={{ padding: 10, textAlign: "right" }}>Costo Est.</th>
              <th style={{ padding: 10, textAlign: "right" }}>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {dataUtilidad.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 10 }}>{r.nombre}</td>
                <td style={{ padding: 10, textAlign: "right" }}>{fmt(r.vendido)}</td>
                <td style={{ padding: 10, textAlign: "right", color: r.costo === 0 ? "#94a3b8" : "#ef4444" }}>
                  {r.costo === 0 ? "Sin costo" : fmt(r.costo)}
                </td>
                <td style={{ padding: 10, textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>{fmt(r.ganancia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
