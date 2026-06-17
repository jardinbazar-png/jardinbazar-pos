// Reportes.jsx actualizado con pestaña de Costos
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

const TABS = [
  { key: "ranking", label: "🏆 Más Vendidos" },
  { key: "categorias", label: "📦 Por Categoría/Marca" },
  { key: "resumen", label: "📋 Resumen" },
  { key: "graficos", label: "📈 Gráficos" },
  { key: "costos", label: "🚚 Costos" }
];

// ... [Mantén las funciones getDesde, bucketKey, bucketLabel, METODO_LABEL originales] ...

export default function Reportes() {
  const [rango, setRango] = useState("semana");
  const [tab, setTab] = useState("ranking");
  const [costos, setCostos] = useState([]); // Nueva variable para costos

  // ... [Mantén tus estados de ventasRango, detalleRango, etc.] ...

  const cargarDatos = useCallback(async (tipo) => {
    setLoading(true);
    // ... [Tu lógica existente de ventas y detalle] ...
    
    // Carga de costos
    const { data: dataCostos } = await supabase.from("costos_productos").select("*");
    setCostos(dataCostos || []);
    
    setLoading(false);
  }, []);

  // ... [Añade la vista de la nueva pestaña en el JSX] ...
  {!loading && tab === "costos" && (
    <div style={s.tableContainer}>
      <table style={s.table}>
        <thead><tr><th>Proveedor</th><th>Costo</th><th>Fecha</th></tr></thead>
        <tbody>
          {costos.map(c => (
            <tr key={c.id}><td>{c.proveedor}</td><td>{fmt(c.costo)}</td><td>{new Date(c.fecha).toLocaleDateString()}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
  // ...
}
