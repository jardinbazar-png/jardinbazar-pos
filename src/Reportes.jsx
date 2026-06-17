import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
// USAMOS LA PUBLIC KEY, NO LA SECRET KEY
const SUPABASE_KEY = "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ"; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [costos, setCostos] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    // Cambiamos a una consulta simple
    const { data, error } = await supabase.from("costos_productos").select("*");
    
    if (error) {
      console.error("Error detallado:", error);
    } else {
      console.log("Datos recibidos:", data);
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
                  No se encontraron datos. Asegúrate de haber guardado al menos una fila en Supabase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
