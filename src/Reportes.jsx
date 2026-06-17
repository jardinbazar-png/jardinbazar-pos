import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [tab, setTab] = useState("ranking"); // Empezamos en ranking
  const [ventas, setVentas] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [costos, setCostos] = useState([]);

  // Carga unificada de todos los datos necesarios
  useEffect(() => {
    async function fetchData() {
      const [v, d, c] = await Promise.all([
        supabase.from("ventas").select("*"),
        supabase.from("detalle_ventas").select("producto_id, producto_nombre, cantidad, subtotal"),
        supabase.from("costos_productos").select("producto_id, costo")
      ]);
      setVentas(v.data || []);
      setDetalle(d.data || []);
      setCostos(c.data || []);
    }
    fetchData();
  }, []);

  const dataUtilidad = useMemo(() => {
    const mapa = new Map();
    const costosMap = new Map();
    // Si no hay ID, usamos nombre como fallback para los datos ficticios
    costos.forEach(c => { if(c.producto_id) costosMap.set(c.producto_id, Number(c.costo)); });

    detalle.forEach(d => {
      const id = d.producto_id || "sin-id";
      const costoU = costosMap.get(id) || (Number(d.subtotal) * 0.7); // Margen 30% estimado si falta costo
      
      if (!mapa.has(d.producto_nombre)) {
        mapa.set(d.producto_nombre, { nombre: d.producto_nombre, vendido: 0, costo: 0 });
      }
      const r = mapa.get(d.producto_nombre);
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
      {/* Selector de Pestañas */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["ranking", "resumen", "costos", "utilidad"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ textTransform: "uppercase", padding: "8px 15px", background: tab === t ? "#0f172a" : "#e2e8f0", color: tab === t ? "#fff" : "#000", border: "none", borderRadius: 5, fontWeight: "bold" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Contenido según pestaña */}
      {tab === "ranking" && <p>Total Ventas registradas: {ventas.length}</p>}
