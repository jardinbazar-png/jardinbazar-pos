import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://carcghqhciuqpjedomuw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ntaEm56Or8HgmabowxI_jg_yTISD-NZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Reportes() {
  const [datos, setDatos] = useState({ ventas: [], detalle: [], costos: [] });

  useEffect(() => {
    async function fetchData() {
      const [v, d, c] = await Promise.all([
        supabase.from("ventas").select("*"),
        supabase.from("detalle_ventas").select("*"),
        supabase.from("costos_productos").select("*")
      ]);
      
      // MIRA ESTO: Esto imprimirá los datos en la consola de tu navegador (F12)
      console.log("Datos recibidos de Supabase:", { v: v.data, d: d.data, c: c.data });
      
      setDatos({ ventas: v.data || [], detalle: d.data || [], costos: c.data || [] });
    }
    fetchData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug de Datos</h1>
      <p>Ventas: {datos.ventas.length} | Detalles: {datos.detalle.length} | Costos: {datos.costos.length}</p>
      <p>⚠️ Abre la consola del navegador (F12) y ve a la pestaña "Console" para ver si los datos llegaron vacíos o con error.</p>
    </div>
  );
}
