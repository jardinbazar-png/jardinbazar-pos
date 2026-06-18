import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://carcghqhciuqpjedomuw.supabase.co", "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ");

export default function Reportes() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Pedimos datos a la nueva vista
      const { data } = await supabase.from("vista_reporte_utilidad").select("*");
      setData(data || []);
    }
    loadData();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Reporte de Utilidad</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th>Producto</th><th>Vendido</th><th>Costo</th><th>Ganancia</th>
          </tr>
        </thead>
        <tbody>
  {data.map((item, i) => {
    const v = item.valor_venta || 0;
    const c = item.costo_unidad || 0;
    const g = v - c;
    return (
      <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
        <td>{item.nombre_producto}</td>
        <td>${v}</td>
        <td>
            {c === 0 ? 
              <span style={{color: 'orange', fontSize: '10px'}}>SIN COSTO</span> : 
              `$${c}`
            }
        </td>
        <td style={{ color: g >= 0 ? "green" : "red", fontWeight: "bold" }}>${g}</td>
      </tr>
    );
  })}
</tbody>
      </table>
    </div>
  );
}
