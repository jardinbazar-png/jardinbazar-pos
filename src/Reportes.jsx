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
  { key: "utilidad", label: "📊 Utilidad (Nueva)" }, // Nueva pestaña
];

export default function Reportes() {
  const [tab, setTab] = useState("utilidad");
  const [ventasRango, setVentasRango] = useState([]);
  const [detalleRango, setDetalleRango] = useState([]);
  const [costosRango, setCostosRango] = useState([]);
  const [productosMap, setProductosMap] = useState(new Map());

  // Cargar productos para tener nombres
  useEffect(() => {
    supabase.from("productos").select("id, nombre").then(({ data }) => {
      if (data) setProductosMap(new Map(data.map((p) => [p.id, p])));
    });
    
    // Cargar datos iniciales
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const [resVentas, resDetalle, resCostos] = await Promise.all([
      supabase.from("ventas").select("*"),
      supabase.from("detalle_ventas").select("producto_id, producto_nombre, cantidad, subtotal"),
      supabase.from(TABLE_COSTOS).select("*")
    ]);
    
    setVentasRango(resVentas.data || []);
    setDetalleRango(resDetalle.data || []);
    setCostosRango(resCostos.data || []);
  };

  // Lógica de utilidad (Fusión)
  const reporteUtilidad = useMemo(() => {
    const costosPromedio = new Map();
    costosRango.forEach(c => {
      costosPromedio.set(c.producto_id, c.costo); // Toma el último costo registrado
    });

    const mapaUtilidad = new Map();
    detalleRango.forEach(d => {
      const costoUnitario = costosPromedio.get(d.producto_id) || 0;
      const costoTotal = costoUnitario * d.cantidad;
      const ingreso = Number(d.subtotal);
      
      if (!mapaUtilidad.has(d.producto_id)) {
        mapaUtilidad.set(d.producto_id, { nombre: d.producto_nombre, vendido: 0, costo: 0, ganancia: 0 });
      }
      const r = mapaUtilidad.get(d.producto_id);
      r.vendido += ingreso;
      r.costo += costoTotal;
      r.ganancia += (ingreso - costoTotal);
    });
    return Array.from(mapaUtilidad.values()).sort((a, b) => b.ganancia - a.ganancia);
  }, [detalleRango, costosRango]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: "8px 15px", background: tab === t.key ? "#0f172a" : "#e2e8f0", color: tab === t.key ? "#fff" : "#000", border: "none", borderRadius: 5 }}>
            {t.label}
          </button>
        ))}
      </div>

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
            {reporteUtilidad.map((r, i) => (
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
