insert into public.categories (id, name, icon, sort_order) values
('detailing','Detailing','spark',1),('limpieza-exterior','Limpieza exterior','car',2),('limpieza-interior','Limpieza interior','seat',3),('ceras-abrillantadores','Ceras y abrillantadores','shield',4),('accesorios','Accesorios','bag',5),('lubricantes','Lubricantes','drop',6),('filtros','Filtros','filter',7),('mantenimiento','Productos para mantenimiento','wrench',8),('otros','Otros','dots',9)
on conflict (id) do update set name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order;

insert into public.products (id,name,description,price,stock,category_id,featured,image_url,art) values
('shampoo-neutro','Shampoo neutro','Limpieza profunda y segura para la pintura.',5800,24,'limpieza-exterior',true,null,'{"shape":"bottle","color":"#2f9e5b"}'),
('limpia-llantas','Limpia llantas','Elimina el polvo de frenos y realza el brillo.',6500,12,'limpieza-exterior',false,null,'{"shape":"spray","color":"#cfd6dc"}'),
('limpia-vidrios','Limpia vidrios','Cristales sin vetas ni marcas.',4300,18,'limpieza-exterior',false,null,'{"shape":"spray","color":"#1fa6b8"}'),
('limpiador-interiores','Limpiador de interiores','Renueva y protege tapizados y plásticos.',7200,15,'limpieza-interior',true,null,'{"shape":"bottle","color":"#6fbf2a"}'),
('renovador-tablero','Renovador de tablero','Acabado mate y protección contra el sol.',6900,3,'limpieza-interior',false,null,'{"shape":"spray","color":"#e8a317"}'),
('cera-liquida','Cera líquida','Brillo y protección por más tiempo.',8900,10,'ceras-abrillantadores',true,null,'{"shape":"bottle","color":"#e11d2e"}'),
('cera-pasta','Cera en pasta','Protección intensa para la pintura.',12500,0,'ceras-abrillantadores',false,null,'{"shape":"tin","color":"#e8a317"}'),
('abrillantador-neumaticos','Abrillantador de neumáticos','Negro profundo y protección.',6800,14,'detailing',true,null,'{"shape":"bottle","color":"#e8a317"}'),
('kit-lavado','Kit de lavado completo','Shampoo, esponja y paño de microfibra.',28900,6,'detailing',true,null,'{"shape":"box","color":"#e11d2e"}'),
('arcilla-descontaminante','Arcilla descontaminante','Quita impurezas adheridas a la pintura.',15800,4,'detailing',false,null,'{"shape":"tin","color":"#1fa6b8"}'),
('microfibra-x3','Paños de microfibra x3','Suaves, absorbentes y sin pelusa.',4200,40,'accesorios',true,null,'{"shape":"cloth","color":"#e11d2e"}'),
('aromatizante','Aromatizante','Fragancia duradera para tu auto.',3900,30,'accesorios',false,null,'{"shape":"spray","color":"#1fa6b8"}'),
('aceite-5w30','Aceite 5W-30 sintético 4 L','Protección y rendimiento para el motor.',38500,8,'lubricantes',true,null,'{"shape":"jug","color":"#e11d2e"}'),
('aceite-10w40','Aceite 10W-40 semisintético 4 L','Uso diario, motores nafteros y diésel.',32000,6,'lubricantes',false,null,'{"shape":"jug","color":"#e8a317"}'),
('aceite-15w40','Aceite 15W-40 mineral 4 L','Lubricación económica para uso general.',29000,5,'lubricantes',false,null,'{"shape":"jug","color":"#2f6fd1"}'),
('filtro-aceite','Filtro de aceite','Retiene impurezas y cuida el motor.',5200,20,'filtros',true,null,'{"shape":"filter","color":"#e11d2e"}'),
('filtro-aire','Filtro de aire','Mejor respiración y menor consumo.',6800,11,'filtros',false,null,'{"shape":"filter","color":"#e8a317"}'),
('refrigerante','Refrigerante 1 L','Protege el motor del sobrecalentamiento.',9800,13,'mantenimiento',false,null,'{"shape":"jug","color":"#1fa6b8"}'),
('aditivo-combustible','Aditivo para combustible','Limpia inyectores y mejora el rendimiento.',4900,17,'mantenimiento',false,null,'{"shape":"bottle","color":"#2f6fd1"}'),
('desengrasante-motor','Desengrasante de motor','Remueve grasa y suciedad del vano motor.',7400,9,'mantenimiento',false,null,'{"shape":"spray","color":"#e8a317"}'),
('escobillas-limpiaparabrisas','Escobillas limpiaparabrisas (par)','Barrido silencioso y sin marcas.',9500,7,'otros',false,null,'{"shape":"box","color":"#2a323a"}')
on conflict (id) do update set name = excluded.name, description = excluded.description, price = excluded.price, stock = excluded.stock, category_id = excluded.category_id, featured = excluded.featured, art = excluded.art;
