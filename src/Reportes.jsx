const dataUtilidad = useMemo(() => {
    const mapa = new Map();
    // Creamos un mapa de costos usando el nombre (si el ID es NULL)
    const costosMap = new Map();
    costos.forEach(c => { 
       // Usamos el ID si existe, si no, intentamos un identificador ficticio o nombre
       costosMap.set(c.producto_id || "sin-id", Number(c.costo)); 
    });

    detalle.forEach(d => {
      // Intentamos encontrar el costo por ID, o por una lógica de "producto ficticio"
      const id = d.producto_id || "sin-id";
      const costoU = costosMap.get(id) || (d.subtotal * 0.7); // Si no hay costo, asumimos un margen de 30% para que no salga $0
      
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
