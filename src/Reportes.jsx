import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://carcghqhciuqpjedomuw.supabase.co", "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ");

const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n ?? 0);

export default function Reportes() {
  const [tab, setTab] = useState("utilidad");
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from("vista_reporte_utilidad").select("*");
      setData(data || []);
    }
    loadData();
  }, []);

  const totalVendido = data.reduce((acc, curr) => acc + (curr.valor_venta || 0), 0);
  const totalUtilidad = data.reduce((acc, curr) => acc + (curr.utilidad_neta || 0), 0);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        {["ranking", "resumen", "costos", "utilidad"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "10px", textTransform: "uppercase", fontWeight: "bold" }}>{t}</button>
        ))}
      </div>

      {tab === "utilidad" && (
        <table style={{ width: "100%" }}>
          <thead><tr><th>Producto</th><th>Vendido</th><th>Costo</th><th>Utilidad</th></tr></thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{item.nombre_producto}</td>
                <td>{fmt(item.valor_venta)}</td>
                <td>{fmt(item.costo_unidad)}</td>
                <td style={{ color: item.utilidad_neta >= 0 ? "green" : "red" }}>{fmt(item.utilidad_neta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "resumen" && (
        <div>
          <h3>Resumen Ejecutivo</h3>
          <p>Total Ventas: <b>{fmt(totalVendido)}</b></p>
          <p>Utilidad Total: <b>{fmt(totalUtilidad)}</b></p>
          <p>Registros analizados: {data.length}</p>
        </div>
      )}

      {tab === "ranking" && (
        <div>
          <h3>Ranking de Ventas</h3>
          {data.sort((a,b) => b.valor_venta - a.valor_venta).map((item, i) => (
            <p key={i}>{i+1}. {item.nombre_producto}: {fmt(item.valor_venta)}</p>
          ))}
        </div>
      )}

      {tab === "costos" && (
        <div>
          <h3>Detalle de Costos</h3>
          {data.map((item, i) => (
            <p key={i}>{item.nombre_producto} | Costo unitario: {fmt(item.costo_unidad)}</p>
          ))}
        </div>
      )}
    </div>
  );
}
