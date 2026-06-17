import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmNnaHFoY2l1cXBqZWRvbXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMzI1MjAsImV4cCI6MjA5NjcwODUyMH0.tpxnLu0yLviVAt-QswRf8JBVs2Y9yVqKN47coo_nB6A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE_COSTOS = "costos_productos"; // Nombre verificado en tu Supabase

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [costos, setCostos] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    // Intentamos cargar la nueva tabla
    const { data, error } = await supabase.from(TABLE_COSTOS).select("*");
    
    if (error) {
      setErrorMsg("Error al cargar costos: " + error.message);
    } else {
      setCostos(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Reporte de Costos</h1>
      {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
      {loading ? <div>Cargando...</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>Proveedor</th>
              <th style={{ borderBottom: "1px solid #ccc", textAlign: "right" }}>Costo</th>
            </tr>
          </thead>
          <tbody>
            {costos.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: 8 }}>{c.proveedor}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{fmt(c.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
