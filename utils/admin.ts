// Identidad del administrador centralizada.
// Puedes sobreescribirla en Vercel con la variable de entorno ADMIN_USER_ID
// (Settings → Environment Variables) sin tocar el código.
export const ADMIN_USER_ID =
    process.env.ADMIN_USER_ID || '6411ba0e-5e36-4e4e-aa1f-4183a2f88d45';

export function isAdminUser(userId?: string | null): boolean {
    return !!userId && userId === ADMIN_USER_ID;
}
