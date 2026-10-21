-- Dar permisos de administrador a un usuario.
-- 1) Crear el usuario en Supabase: Authentication > Users > Add user (email y contraseña).
-- 2) Reemplazar EMAIL_DEL_ADMIN por ese email y ejecutar esto en el SQL Editor.
--    Si dice "0 rows", el email está mal escrito o el usuario no existe todavía.
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = lower('EMAIL_DEL_ADMIN')
on conflict (user_id) do update set email = excluded.email;

-- Para quitarle los permisos:
-- delete from public.admin_users where email = lower('EMAIL_DEL_ADMIN');
