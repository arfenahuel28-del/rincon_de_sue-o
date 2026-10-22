/* ==========================================================
   RINCÓN DE SUEÑO – catálogo (DATOS DE EJEMPLO)
   Es el catálogo de respaldo: si Supabase responde, la tienda usa el de
   la base de datos (ver js/store.js). Mantenelo parecido a supabase/seed.sql.

   CATEGORÍAS: `id` es el que usan los productos y la URL
   (productos.html?categoria=<id>). `icon` es uno de:
   bed, quilt, pillow, towel, curtain, table, moon, tag, heart,
   spark, bag, shield, dots.
   Desde el panel de administración también se pueden crear y editar.

   PRODUCTOS:
     id          texto único, sin espacios (ej. 'toalla-bano')
     name        nombre
     description descripción corta (1 línea)
     price       precio en pesos, número entero
     stock       unidades disponibles (0 = "Sin stock")
     soldOut     true para marcarlo agotado aunque tenga stock
     category    id de categoría
     featured    true para mostrarlo en el inicio
     active      false para ocultarlo sin borrarlo
     image       ruta de la foto, ej. 'assets/products/toalla-bano.jpg'
                 (si queda vacío o falla, se dibuja el producto)
     art         dibujo de reemplazo: shape (folded, towel, pillow, quilt,
                 curtain, cloth, gift) y color
   ⚠️ Nombres, precios y stock de abajo son de EJEMPLO.
   ========================================================== */
window.BLACK_CATEGORIES = [
  { id: 'sabanas', name: 'Sábanas', icon: 'bed' },
  { id: 'acolchados-edredones', name: 'Acolchados y edredones', icon: 'quilt' },
  { id: 'almohadas', name: 'Almohadas', icon: 'pillow' },
  { id: 'toallas-toallones', name: 'Toallas y toallones', icon: 'towel' },
  { id: 'cortinas', name: 'Cortinas', icon: 'curtain' },
  { id: 'manteleria', name: 'Mantelería', icon: 'table' },
  { id: 'infantil', name: 'Infantil', icon: 'moon' },
  { id: 'ofertas', name: 'Ofertas', icon: 'tag' },
];

window.BLACK_PRODUCTS = [
  { id: 'sabanas-algodon-2p', name: 'Juego de sábanas algodón 2 plazas', description: 'Algodón peinado, suave y fresco. Incluye 4 piezas.', price: 48900, stock: 12, category: 'sabanas', featured: true, image: '', art: { shape: 'folded', color: '#b8c4b0' } },
  { id: 'sabanas-percal-queen', name: 'Juego de sábanas percal Queen', description: 'Percal de 200 hilos, tacto liso y duradero.', price: 62500, stock: 8, category: 'sabanas', featured: true, image: '', art: { shape: 'folded', color: '#d9c3c8' } },
  { id: 'sabanas-franela-1p5', name: 'Sábanas de franela 1 plaza y media', description: 'Cálidas y abrigadas para el invierno.', price: 35800, stock: 5, category: 'sabanas', image: '', art: { shape: 'folded', color: '#c9a98f' } },

  { id: 'acolchado-reversible', name: 'Acolchado reversible 2 plazas', description: 'Liviano y abrigado, dos diseños en uno.', price: 89900, stock: 7, category: 'acolchados-edredones', featured: true, image: '', art: { shape: 'quilt', color: '#b9a3b0' } },
  { id: 'edredon-simil-plumon', name: 'Edredón símil plumón Queen', description: 'Relleno de microfibra siliconada, muy mullido.', price: 124500, stock: 4, category: 'acolchados-edredones', featured: true, image: '', art: { shape: 'quilt', color: '#d8cfc0' } },
  { id: 'manta-polar-2p', name: 'Manta polar 2 plazas', description: 'Suave, liviana y de secado rápido.', price: 29900, stock: 0, category: 'acolchados-edredones', image: '', art: { shape: 'quilt', color: '#8a97ad' } },

  { id: 'almohada-fibra', name: 'Almohada de fibra', description: 'Firmeza media, ideal para dormir de costado.', price: 12900, stock: 25, category: 'almohadas', featured: true, image: '', art: { shape: 'pillow', color: '#cdbfae' } },
  { id: 'almohada-viscoelastica', name: 'Almohada viscoelástica', description: 'Se adapta al cuello y mantiene su forma.', price: 24800, stock: 3, category: 'almohadas', image: '', art: { shape: 'pillow', color: '#a9b8c9' } },
  { id: 'almohada-simil-plumon', name: 'Almohada símil plumón', description: 'Suave y esponjosa, con funda de algodón.', price: 17500, stock: 14, category: 'almohadas', image: '', art: { shape: 'pillow', color: '#d9c3c8' } },

  { id: 'toalla-bano', name: 'Toalla de baño 100% algodón', description: 'Gruesa y muy absorbente, 70 x 140 cm.', price: 14900, stock: 30, category: 'toallas-toallones', featured: true, image: '', art: { shape: 'towel', color: '#9fb3a6' } },
  { id: 'toallon-playa-rayado', name: 'Toallón de playa rayado', description: 'Liviano y de secado rápido, 90 x 170 cm.', price: 18700, stock: 16, category: 'toallas-toallones', image: '', art: { shape: 'towel', color: '#d9a58b' } },
  { id: 'set-toallas-3', name: 'Set de 3 toallas (cuerpo, mano y rostro)', description: 'Combinadas en un mismo color, listas para regalar.', price: 27900, stock: 10, category: 'toallas-toallones', featured: true, image: '', art: { shape: 'gift', color: '#b9a3b0' } },

  { id: 'cortina-blackout', name: 'Cortina blackout 1,40 x 2,10 m', description: 'Bloquea la luz y ayuda a mantener la temperatura.', price: 32500, stock: 8, category: 'cortinas', featured: true, image: '', art: { shape: 'curtain', color: '#8a97ad' } },
  { id: 'cortina-voile-2-panos', name: 'Cortina voile 2 paños', description: 'Tela liviana que deja pasar la luz suave.', price: 19800, stock: 11, category: 'cortinas', image: '', art: { shape: 'curtain', color: '#d8cfc0' } },

  { id: 'mantel-antimanchas', name: 'Mantel rectangular antimanchas', description: 'Resistente y fácil de lavar, para 6 personas.', price: 17900, stock: 12, category: 'manteleria', image: '', art: { shape: 'cloth', color: '#c9a98f' } },
  { id: 'repasadores-x3', name: 'Repasadores de algodón x3', description: 'Absorbentes, con diseño a rayas.', price: 8900, stock: 28, category: 'manteleria', image: '', art: { shape: 'cloth', color: '#9fb3a6' } },

  { id: 'sabanas-infantiles-1p', name: 'Sábanas infantiles estampadas 1 plaza', description: 'Estampas suaves, mezcla de algodón y poliéster.', price: 29500, stock: 9, category: 'infantil', image: '', art: { shape: 'folded', color: '#a9b8c9' } },
  { id: 'toalla-capucha-bebe', name: 'Toalla con capucha para bebé', description: 'Algodón suave con orejitas.', price: 15500, stock: 13, category: 'infantil', image: '', art: { shape: 'towel', color: '#e0b8c0' } },

  { id: 'oferta-sabanas-2p', name: 'Sábanas 2 plazas · oferta', description: 'Último pack de la temporada.', price: 31900, stock: 6, category: 'ofertas', image: '', art: { shape: 'folded', color: '#d9a58b' } },
  { id: 'oferta-pack-almohadas', name: 'Pack 2 almohadas de fibra', description: 'Dos almohadas al precio promocional.', price: 21500, stock: 10, category: 'ofertas', image: '', art: { shape: 'pillow', color: '#cdbfae' } },
];
