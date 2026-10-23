-- ==========================================================
-- RINCÓN DE SUEÑO – datos de ejemplo (blanquería)
-- Se ejecuta en Supabase: SQL Editor → New query → pegar todo → Run.
--
-- ⚠️⚠️ ATENCIÓN: ESTE ARCHIVO BORRA DATOS ⚠️⚠️
-- Las dos primeras instrucciones (DELETE) ELIMINAN todos los productos
-- de las categorías del lubricentro (Detailing, Limpieza, Ceras, Accesorios,
-- Lubricantes, Filtros, Mantenimiento, Otros) y esas categorías.
-- Los pedidos que ya existan NO se tocan.
-- Si no querés borrar nada, borrá las dos instrucciones DELETE de abajo.
--
-- Después carga las categorías y los productos de ejemplo de la blanquería.
-- Se puede volver a correr, pero pisaría el nombre, precio y stock de los
-- productos de ejemplo: no lo corras otra vez cuando ya cargaste los tuyos.
-- Orden en un proyecto nuevo: schema.sql → seed.sql → admin-user.sql
-- ==========================================================

-- 1) BORRA los productos de ejemplo del lubricentro
delete from public.products
where category_id in ('detailing', 'limpieza-exterior', 'limpieza-interior', 'ceras-abrillantadores', 'accesorios', 'lubricantes', 'filtros', 'mantenimiento', 'otros');

-- 2) BORRA las categorías de ejemplo del lubricentro
delete from public.categories
where id in ('detailing', 'limpieza-exterior', 'limpieza-interior', 'ceras-abrillantadores', 'accesorios', 'lubricantes', 'filtros', 'mantenimiento', 'otros');

-- 3) Categorías de la blanquería
insert into public.categories (id, name, icon, sort_order) values
('sabanas','Sábanas','bed',1),
('acolchados-edredones','Acolchados y edredones','quilt',2),
('almohadas','Almohadas','pillow',3),
('toallas-toallones','Toallas y toallones','towel',4),
('cortinas','Cortinas','curtain',5),
('manteleria','Mantelería','table',6),
('infantil','Infantil','moon',7),
('ofertas','Ofertas','tag',8)
on conflict (id) do update set name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order;

-- 4) Productos de ejemplo (precios en pesos argentinos, solo de muestra).
--    Algunos traen colores disponibles dentro de la columna art (art.colors).
insert into public.products (id,name,description,price,stock,category_id,featured,image_url,art) values
('sabanas-algodon-2p','Juego de sábanas algodón 2 plazas','Algodón peinado, suave y fresco. Incluye 4 piezas.',48900,12,'sabanas',true,null,'{"shape":"folded","color":"#b8c4b0","colors":[{"name":"Blanco","hex":"#f5f2ec"},{"name":"Celeste","hex":"#8ec5e8"},{"name":"Gris","hex":"#8d8d8d"},{"name":"Rosa","hex":"#e8b4c0"}]}'),
('sabanas-percal-queen','Juego de sábanas percal Queen','Percal de 200 hilos, tacto liso y duradero.',62500,8,'sabanas',true,null,'{"shape":"folded","color":"#d9c3c8","colors":[{"name":"Blanco","hex":"#f5f2ec"},{"name":"Beige","hex":"#d9c8ad"},{"name":"Azul marino","hex":"#1b2a4a"}]}'),
('sabanas-franela-1p5','Sábanas de franela 1 plaza y media','Cálidas y abrigadas para el invierno.',35800,5,'sabanas',false,null,'{"shape":"folded","color":"#c9a98f"}'),
('acolchado-reversible','Acolchado reversible 2 plazas','Liviano y abrigado, dos diseños en uno.',89900,7,'acolchados-edredones',true,null,'{"shape":"quilt","color":"#b9a3b0","colors":[{"name":"Beige","hex":"#d9c8ad"},{"name":"Gris","hex":"#8d8d8d"},{"name":"Bordó","hex":"#6e1f2e"}]}'),
('edredon-simil-plumon','Edredón símil plumón Queen','Relleno de microfibra siliconada, muy mullido.',124500,4,'acolchados-edredones',true,null,'{"shape":"quilt","color":"#d8cfc0"}'),
('manta-polar-2p','Manta polar 2 plazas','Suave, liviana y de secado rápido.',29900,0,'acolchados-edredones',false,null,'{"shape":"quilt","color":"#8a97ad"}'),
('almohada-fibra','Almohada de fibra','Firmeza media, ideal para dormir de costado.',12900,25,'almohadas',true,null,'{"shape":"pillow","color":"#cdbfae"}'),
('almohada-viscoelastica','Almohada viscoelástica','Se adapta al cuello y mantiene su forma.',24800,3,'almohadas',false,null,'{"shape":"pillow","color":"#a9b8c9"}'),
('almohada-simil-plumon','Almohada símil plumón','Suave y esponjosa, con funda de algodón.',17500,14,'almohadas',false,null,'{"shape":"pillow","color":"#d9c3c8"}'),
('toalla-bano','Toalla de baño 100% algodón','Gruesa y muy absorbente, 70 x 140 cm.',14900,30,'toallas-toallones',true,null,'{"shape":"towel","color":"#9fb3a6","colors":[{"name":"Blanco","hex":"#f5f2ec"},{"name":"Gris","hex":"#8d8d8d"},{"name":"Verde agua","hex":"#9fd3c7"},{"name":"Celeste","hex":"#8ec5e8"}]}'),
('toallon-playa-rayado','Toallón de playa rayado','Liviano y de secado rápido, 90 x 170 cm.',18700,16,'toallas-toallones',false,null,'{"shape":"towel","color":"#d9a58b"}'),
('set-toallas-3','Set de 3 toallas (cuerpo, mano y rostro)','Combinadas en un mismo color, listas para regalar.',27900,10,'toallas-toallones',true,null,'{"shape":"gift","color":"#b9a3b0"}'),
('cortina-blackout','Cortina blackout 1,40 x 2,10 m','Bloquea la luz y ayuda a mantener la temperatura.',32500,8,'cortinas',true,null,'{"shape":"curtain","color":"#8a97ad","colors":[{"name":"Gris","hex":"#8d8d8d"},{"name":"Beige","hex":"#d9c8ad"},{"name":"Azul marino","hex":"#1b2a4a"}]}'),
('cortina-voile-2-panos','Cortina voile 2 paños','Tela liviana que deja pasar la luz suave.',19800,11,'cortinas',false,null,'{"shape":"curtain","color":"#d8cfc0"}'),
('mantel-antimanchas','Mantel rectangular antimanchas','Resistente y fácil de lavar, para 6 personas.',17900,12,'manteleria',false,null,'{"shape":"cloth","color":"#c9a98f","colors":[{"name":"Blanco","hex":"#f5f2ec"},{"name":"Beige","hex":"#d9c8ad"},{"name":"Gris","hex":"#8d8d8d"}]}'),
('repasadores-x3','Repasadores de algodón x3','Absorbentes, con diseño a rayas.',8900,28,'manteleria',false,null,'{"shape":"cloth","color":"#9fb3a6","colors":[{"name":"Rojo","hex":"#c0392b"},{"name":"Azul","hex":"#2c5aa0"},{"name":"Verde","hex":"#3f7d4e"}]}'),
('sabanas-infantiles-1p','Sábanas infantiles estampadas 1 plaza','Estampas suaves, mezcla de algodón y poliéster.',29500,9,'infantil',false,null,'{"shape":"folded","color":"#a9b8c9"}'),
('toalla-capucha-bebe','Toalla con capucha para bebé','Algodón suave con orejitas.',15500,13,'infantil',false,null,'{"shape":"towel","color":"#e0b8c0"}'),
('oferta-sabanas-2p','Sábanas 2 plazas · oferta','Último pack de la temporada.',31900,6,'ofertas',false,null,'{"shape":"folded","color":"#d9a58b"}'),
('oferta-pack-almohadas','Pack 2 almohadas de fibra','Dos almohadas al precio promocional.',21500,10,'ofertas',false,null,'{"shape":"pillow","color":"#cdbfae"}')
on conflict (id) do update set name = excluded.name, description = excluded.description, price = excluded.price, stock = excluded.stock, category_id = excluded.category_id, featured = excluded.featured, art = excluded.art;
