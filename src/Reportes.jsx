import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE_COSTOS = "costos_productos";
const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

const TABS = [
  { key: "ranking", label: "🏆 Más Vendidos" },
  { key: "resumen", label: "📋 Resumen" },
  { key: "costos", label: "🚚 Costos" },
  { key: "utilidad", label: "📊 Utilidad" },
];

export default function Reportes() {
  const [tab, setTab] = useState("utilidad");
  const [ventas, setVentas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [costos, setCostos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [v, d, c] = await Promise.all([
        supabase.from("ventas").select("*"),
        supabase.from("detalle_ventas").select("*"),
        supabase.from(TABLE_COSTOS).select("*")
      ]);
      setVentas(v.data || []);
      setDetalle(d.data || []);
      setCostos(c.data || []);
    }
    fetchData();
  }, []);

  const dataUtilidad = useMemo(() => {
    const mapa = new Map();
    // Agrupamos costos por producto_id (tomando el último costo)
    const ultimosCostos = new Map();
    costos.forEach(c => ultimosCostos.set(c.producto_id, c.costo));

    detalle.forEach(d => {
      const id = d.producto_id;
      const costoU = ultimosCostos.get(id) || 0;
      const ingreso = Number(d.subtotal) || 0;
      const costoTotal = costoU * (Number(d.cantidad) || 0);

      if (!mapa.has(id)) mapa.set(id, { nombre: d.producto_nombre, vendido: 0, costo: 0 });
      const r = mapa.get(id);
      r.vendido += ingreso;
      r.costo += costoTotal;
    });
    
    return Array.from(mapa.values()).map(r => ({
      ...r,
      ganancia: r.vendido - r.costo
    })).sort((a, b) => b.ganancia - a.ganancia);
  }, [detalle, costos]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 15px", background: tab === t.key ? "#0f172a" : "#e2e8f0", color: tab === t.key ? "#fff" : "#000", border: "none", borderRadius: 5 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ranking" && <p>Total Ventas: {ventas.length} registros cargados.</p>}
      
      {tab === "utilidad" && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
