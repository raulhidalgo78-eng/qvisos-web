// Identidad del administrador centralizada.
// Puedes sobreescribirla en Vercel con la variable de entorno ADMIN_USER_ID
// (Settings → Environment Variables) sin tocar el código.
export const ADMIN_USER_ID =
    process.env.ADMIN_USER_ID || '17c66154-71e1-4074-a77d-8703798b2a45';

export function isAdminUser(userId?: string | null): boolean {
    return !!userId && userId === ADMIN_USER_ID;
}
