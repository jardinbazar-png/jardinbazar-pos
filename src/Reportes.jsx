import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://carcghqhciuqpjedomuw.supabase.co", "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ");

// Formateador de moneda
const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Pedimos datos directamente a la Vista que acabas de crear
      const { data, error } = await supabase.from("vista_reporte_utilidad").select("*");
      if (error) console.error("Error al cargar la vista:", error);
      else setData(data || []);
    }
    loadData();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Reporte de Utilidad</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
            <th style={{ padding: "10px" }}>Producto</th>
            <th style={{ padding: "10px", textAlign: "right" }}>Vendido</th>
            <th style={{ padding: "10px", textAlign: "right" }}>Costo</th>
            <th style={{ padding: "10px", textAlign: "right" }}>Utilidad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
              <td style={{ padding: "10px" }}>{item.nombre_producto || "Sin nombre"}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmt(item.valor_venta)}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmt(item.costo_unidad)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: "bold", color: item.utilidad_neta >= 0 ? "green" : "red" }}>
                {fmt(item.utilidad_neta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
