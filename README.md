# BLACK Lubricentro – tienda online (demo)

Sitio estático (HTML, CSS y JavaScript puros). No necesita instalar nada.

## Cómo verlo en tu computadora
1. Copiá tu `logo.png` a `assets/logo/logo.png` (si falta, se muestra el texto "BLACK").
2. Abrí la carpeta con VS Code y usá la extensión **Live Server** ("Go Live"), o abrí `index.html` directamente.

## Páginas
| Archivo | Qué es |
|---|---|
| `index.html` | Inicio: categorías y productos destacados |
| `productos.html` | Catálogo con búsqueda y categorías |
| `carrito.html` / `checkout.html` / `pedido.html` | Carrito, datos del pedido y confirmación |
| `lubricentro.html` / `contacto.html` | Servicios y datos de contacto |
| `admin.html` | Panel de administración (demo): productos y pedidos |

## Qué cambiar antes de mostrarlo
- **Datos del negocio** (teléfono, WhatsApp, dirección, Instagram, horarios): `js/config.js`
- **Productos, precios, stock y categorías**: `js/products-data.js` (o desde `admin.html`)
- **Fotos de productos**: guardarlas en `assets/products/` y poner la ruta en el producto

## Importante: es una demo
Los pedidos, el carrito y los cambios del panel se guardan **solo en el navegador de quien los hace**.
Un pedido hecho desde el celular de un cliente **no aparece** en el panel de otra computadora.
Para vender de verdad hace falta un backend (ver `docs/PREPARACION-BACKEND.md`).

## Publicarlo
Es un sitio estático: se sube la carpeta completa tal cual (sin compilar). Antes de publicar de verdad,
reemplazar `TU-DOMINIO` en `sitemap.xml` y `robots.txt`.
