# Cobrar con tarjeta (Mercado Pago) – Rincón de Sueño

Cuando el cliente elige **Tarjeta de débito** o **Tarjeta de crédito**, la tienda lo lleva a la página segura de Mercado Pago, donde carga su tarjeta. Cuando el pago se aprueba, el pedido pasa solo a **"Pago aprobado"** en tu panel. Los datos de la tarjeta nunca pasan por tu tienda.

La plata la recibe tu cuenta de Mercado Pago y de ahí la mandás a tu cuenta bancaria (CBU o alias).

Los nombres de algunos botones de Mercado Pago y de Supabase pueden variar un poco: si algo no coincide, buscá el más parecido.

---

## Paso 1 – Tu cuenta de Mercado Pago
1. Entrá a Mercado Pago con la cuenta del negocio y completá la verificación de identidad que te pida.
2. Cargá tu cuenta bancaria (CBU o alias) para poder retirar el dinero a tu banco.

## Paso 2 – Crear la aplicación y copiar el Access Token
1. Entrá a **Mercado Pago Developers** (mercadopago.com.ar/developers) → **Tus integraciones** → **Crear aplicación**.
2. Tipo de pago: **Pagos online** → solución: **Checkout Pro**.
3. Entrá a la aplicación → **Credenciales de producción** → copiá el **Access Token** (empieza con `APP_USR-`). **Es secreto: no lo pegues en ningún archivo de la tienda ni lo mandes por chat.**

## Paso 3 – Cargar los secretos en Supabase
Supabase → **Edge Functions** → **Secrets** (o Project Settings → Edge Functions) → agregá:

| Nombre | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | el Access Token del paso 2 |
| `SITE_URL` | la dirección de tu tienda con https y sin barra al final, por ejemplo `https://www.rincondesueno.com.ar` |
| `MP_STATEMENT` | (opcional) el texto que el cliente ve en el resumen de su tarjeta, hasta 22 letras. Si no lo cargás, dice RINCON DE SUENO |

## Paso 4 – Subir las dos funciones
En Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**:

1. Nombre `mp-create-preference`: pegá todo el contenido de `supabase/functions/mp-create-preference/index.ts` → **Deploy**.
2. Nombre `mp-webhook`: pegá todo el contenido de `supabase/functions/mp-webhook/index.ts` → **Deploy**.
   **Importante:** en esta segunda función, desactivá **"Verify JWT"** (en sus ajustes). Mercado Pago no manda login de Supabase y, si queda activado, nunca vas a recibir los avisos de pago.

(Si usás la línea de comandos de Supabase: `supabase functions deploy mp-create-preference` y `supabase functions deploy mp-webhook --no-verify-jwt`.)

## Paso 5 – Avisarle a Mercado Pago dónde mandar los avisos
1. En tu aplicación de Mercado Pago Developers → **Webhooks** → **Configurar notificaciones**, modo **producción**.
2. URL: `https://TU-PROYECTO.supabase.co/functions/v1/mp-webhook` (el mismo dominio de Supabase que está en `js/config.js`).
3. Eventos: marcá **Pagos**. Guardá.
4. Mercado Pago te muestra una **clave secreta**. Copiala y agregala en Supabase como secreto `MP_WEBHOOK_SECRET`.

## Paso 6 – Prender el cobro en la tienda
En `js/config.js` cambiá una sola línea:

```js
payments: { provider: 'mercadopago' },
```

La tienda encuentra sola la función `mp-create-preference` en tu Supabase. Subí los archivos de la tienda con ese cambio.

## Paso 7 – Probar antes de avisar a tus clientes
1. Hacé un pedido de un producto barato (o cambiá el precio por unos minutos) eligiendo **Tarjeta de crédito** y pagá con una tarjeta tuya.
2. Volvés a la tienda y ves "Mercado Pago nos informó que tu pago fue aprobado".
3. En el panel → **Pedidos**, el pedido tiene que decir **Pago aprobado**. Si queda en "Pendiente de pago" después de un par de minutos:
   - Revisá en Supabase → Edge Functions → `mp-webhook` → **Logs**.
   - Si dice "Firma inválida", borrá un momento el secreto `MP_WEBHOOK_SECRET`, probá de nuevo y avisame: la validación de la firma hay que ajustarla.
   - Si no aparece ningún aviso, revisá que "Verify JWT" esté desactivado y que la URL del paso 5 esté bien escrita.
4. Podés devolver la plata de la prueba desde tu cuenta de Mercado Pago.

---

## Cosas para saber
- **Comisión:** Mercado Pago cobra un porcentaje por cada venta con tarjeta (varía según el plazo en que quieras recibir la plata). Fijate las tarifas en tu cuenta.
- **Stock reservado:** el pedido descuenta stock apenas se crea, aunque el cliente no termine de pagar. Si alguien abandona el pago, el pedido queda en "Pendiente de pago": cancelalo desde el panel y el stock vuelve solo.
- **Pago rechazado:** el pedido pasa a "Pago rechazado". El cliente puede reintentar desde el mismo link de Mercado Pago.
- **Devoluciones:** se hacen desde tu cuenta de Mercado Pago. Después, cambiá el estado del pedido a mano en el panel.
- **Efectivo y transferencia** siguen funcionando igual que antes, sin pasar por Mercado Pago.
- **Seguridad:** la función revisa cada pago directamente con Mercado Pago y comprueba que el monto coincida con el pedido antes de marcarlo como pagado, así que nadie puede aprobar un pedido avisando falsamente.
