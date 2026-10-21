/* ==========================================================
   BLACK – catálogo (DATOS DE DEMOSTRACIÓN)
   Hoy es la "base de datos" de la tienda. Cuando exista backend, este
   archivo se reemplaza por la respuesta de GET /api/products y no hace
   falta tocar el resto del código (ver docs/PREPARACION-BACKEND.md).

   CATEGORÍAS: agregar, quitar o renombrar libremente. `id` es el que usan
   los productos y la URL (productos.html?categoria=<id>). `icon` es uno de:
   spark, car, seat, shield, bag, drop, filter, wrench, dots.

   PRODUCTOS:
     id          texto único, sin espacios (ej. 'cera-liquida')
     name        nombre
     description descripción corta (1 línea)
     price       precio en pesos, número entero
     stock       unidades disponibles (0 = "Sin stock")
     soldOut     true para marcarlo agotado aunque tenga stock
     category    id de categoría
     featured    true para mostrarlo en el inicio
     active      false para ocultarlo sin borrarlo
     image       ruta de la foto, ej. 'assets/products/cera-liquida.jpg'
                 (si queda vacío o falla, se dibuja un envase)
     art         dibujo de reemplazo: shape (bottle, spray, jug, tin,
                 filter, cloth, box) y color de la etiqueta
   ⚠️ Nombres, precios y stock de abajo son de ejemplo.
   ========================================================== */
window.BLACK_CATEGORIES = [
  { id: 'detailing', name: 'Detailing', icon: 'spark' },
  { id: 'limpieza-exterior', name: 'Limpieza exterior', icon: 'car' },
  { id: 'limpieza-interior', name: 'Limpieza interior', icon: 'seat' },
  { id: 'ceras-abrillantadores', name: 'Ceras y abrillantadores', icon: 'shield' },
  { id: 'accesorios', name: 'Accesorios', icon: 'bag' },
  { id: 'lubricantes', name: 'Lubricantes', icon: 'drop' },
  { id: 'filtros', name: 'Filtros', icon: 'filter' },
  { id: 'mantenimiento', name: 'Productos para mantenimiento', icon: 'wrench' },
  { id: 'otros', name: 'Otros', icon: 'dots' },
];

window.BLACK_PRODUCTS = [
  { id: 'shampoo-neutro', name: 'Shampoo neutro', description: 'Limpieza profunda y segura para la pintura.', price: 5800, stock: 24, category: 'limpieza-exterior', featured: true, image: '', art: { shape: 'bottle', color: '#2f9e5b' } },
  { id: 'limpia-llantas', name: 'Limpia llantas', description: 'Elimina el polvo de frenos y realza el brillo.', price: 6500, stock: 12, category: 'limpieza-exterior', image: '', art: { shape: 'spray', color: '#cfd6dc' } },
  { id: 'limpia-vidrios', name: 'Limpia vidrios', description: 'Cristales sin vetas ni marcas.', price: 4300, stock: 18, category: 'limpieza-exterior', image: '', art: { shape: 'spray', color: '#1fa6b8' } },

  { id: 'limpiador-interiores', name: 'Limpiador de interiores', description: 'Renueva y protege tapizados y plásticos.', price: 7200, stock: 15, category: 'limpieza-interior', featured: true, image: '', art: { shape: 'bottle', color: '#6fbf2a' } },
  { id: 'renovador-tablero', name: 'Renovador de tablero', description: 'Acabado mate y protección contra el sol.', price: 6900, stock: 3, category: 'limpieza-interior', image: '', art: { shape: 'spray', color: '#e8a317' } },

  { id: 'cera-liquida', name: 'Cera líquida', description: 'Brillo y protección por más tiempo.', price: 8900, stock: 10, category: 'ceras-abrillantadores', featured: true, image: '', art: { shape: 'bottle', color: '#e11d2e' } },
  { id: 'cera-pasta', name: 'Cera en pasta', description: 'Protección intensa para la pintura.', price: 12500, stock: 0, category: 'ceras-abrillantadores', image: '', art: { shape: 'tin', color: '#e8a317' } },

  { id: 'abrillantador-neumaticos', name: 'Abrillantador de neumáticos', description: 'Negro profundo y protección.', price: 6800, stock: 14, category: 'detailing', featured: true, image: '', art: { shape: 'bottle', color: '#e8a317' } },
  { id: 'kit-lavado', name: 'Kit de lavado completo', description: 'Shampoo, esponja y paño de microfibra.', price: 28900, stock: 6, category: 'detailing', featured: true, image: '', art: { shape: 'box', color: '#e11d2e' } },
  { id: 'arcilla-descontaminante', name: 'Arcilla descontaminante', description: 'Quita impurezas adheridas a la pintura.', price: 15800, stock: 4, category: 'detailing', image: '', art: { shape: 'tin', color: '#1fa6b8' } },

  { id: 'microfibra-x3', name: 'Paños de microfibra x3', description: 'Suaves, absorbentes y sin pelusa.', price: 4200, stock: 40, category: 'accesorios', featured: true, image: '', art: { shape: 'cloth', color: '#e11d2e' } },
  { id: 'aromatizante', name: 'Aromatizante', description: 'Fragancia duradera para tu auto.', price: 3900, stock: 30, category: 'accesorios', image: '', art: { shape: 'spray', color: '#1fa6b8' } },

  { id: 'aceite-5w30', name: 'Aceite 5W-30 sintético 4 L', description: 'Protección y rendimiento para el motor.', price: 38500, stock: 8, category: 'lubricantes', featured: true, image: '', art: { shape: 'jug', color: '#e11d2e' } },
  { id: 'aceite-10w40', name: 'Aceite 10W-40 semisintético 4 L', description: 'Uso diario, motores nafteros y diésel.', price: 32000, stock: 6, category: 'lubricantes', image: '', art: { shape: 'jug', color: '#e8a317' } },
  { id: 'aceite-15w40', name: 'Aceite 15W-40 mineral 4 L', description: 'Lubricación económica para uso general.', price: 29000, stock: 5, category: 'lubricantes', image: '', art: { shape: 'jug', color: '#2f6fd1' } },

  { id: 'filtro-aceite', name: 'Filtro de aceite', description: 'Retiene impurezas y cuida el motor.', price: 5200, stock: 20, category: 'filtros', featured: true, image: '', art: { shape: 'filter', color: '#e11d2e' } },
  { id: 'filtro-aire', name: 'Filtro de aire', description: 'Mejor respiración y menor consumo.', price: 6800, stock: 11, category: 'filtros', image: '', art: { shape: 'filter', color: '#e8a317' } },

  { id: 'refrigerante', name: 'Refrigerante 1 L', description: 'Protege el motor del sobrecalentamiento.', price: 9800, stock: 13, category: 'mantenimiento', image: '', art: { shape: 'jug', color: '#1fa6b8' } },
  { id: 'aditivo-combustible', name: 'Aditivo para combustible', description: 'Limpia inyectores y mejora el rendimiento.', price: 4900, stock: 17, category: 'mantenimiento', image: '', art: { shape: 'bottle', color: '#2f6fd1' } },
  { id: 'desengrasante-motor', name: 'Desengrasante de motor', description: 'Remueve grasa y suciedad del vano motor.', price: 7400, stock: 9, category: 'mantenimiento', image: '', art: { shape: 'spray', color: '#e8a317' } },

  { id: 'escobillas-limpiaparabrisas', name: 'Escobillas limpiaparabrisas (par)', description: 'Barrido silencioso y sin marcas.', price: 9500, stock: 7, category: 'otros', image: '', art: { shape: 'box', color: '#2a323a' } },
];
