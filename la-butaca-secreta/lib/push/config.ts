/**
 * Clave pública VAPID de los avisos push. Es pública por diseño (el
 * navegador la necesita para suscribirse); la privada va solo en Vercel
 * → Settings → Environment Variables → VAPID_PRIVATE_KEY, nunca en el
 * código. Si algún día se cambian las claves, hay que cambiar las dos a
 * la vez (y los dispositivos tendrán que volver a activar los avisos).
 */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
  "BOT0WnmxNAKP1ddFYln4LTmVTkOOYwVcnwFHYrGrvUakqvhbbJm2mxZIy3ak5e-VHJhg7xSPCxgxHg8a-58uAc0";
