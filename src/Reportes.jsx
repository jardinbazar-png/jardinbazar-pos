import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [costos, setCostos] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    // Intentamos traer los datos
    const { data, error } = await supabase.from("costos_productos").select("*");
    
    if (error) {
      console.error("Error al traer datos:", error);
    } else {
      console.log("Datos recibidos:", data); // Esto nos dirá si realmente hay algo
      setCostos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Reporte de Costos</h2>
      {loading ? <p>Cargando...</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: 10, textAlign: "left" }}>Producto ID</th>
              <th style={{ padding: 10, textAlign: "left" }}>Proveedor</th>
              <th style={{ padding: 10, textAlign: "right" }}>Costo</th>
            </tr>
          </thead>
          <tbody>
            {costos.length > 0 ? (
              costos.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 10 }}>{c.producto_id}</td>
                  <td style={{ padding: 10 }}>{c.proveedor}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>{fmt(c.costo)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ padding: 20, textAlign: "center" }}>
                  No hay datos en la tabla. Verifica en Supabase si el registro fue guardado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
