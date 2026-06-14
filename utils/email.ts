import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Qvisos <notificaciones@qvisos.cl>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'contacto@qvisos.cl';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qvisos.cl';

// --- ANUNCIO APROBADO → vendedor ---
export async function sendAdApprovedEmail(to: string, adTitle: string, adSlug: string) {
    try {
        await resend.emails.send({
            from: FROM,
            to,
            subject: '✅ Tu anuncio fue aprobado en Qvisos.cl',
            html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b">
                    <img src="${SITE_URL}/logo.png" alt="Qvisos" style="height:36px;margin-bottom:24px" />
                    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">¡Tu anuncio está publicado!</h1>
                    <p style="color:#475569;margin-bottom:24px">
                        <strong>${adTitle}</strong> ya está visible para compradores en Qvisos.cl.
                        Tendrás 90 días de vigencia desde hoy.
                    </p>
                    <a href="${SITE_URL}/anuncio/${adSlug}"
                       style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none">
                        Ver mi anuncio →
                    </a>
                    <p style="margin-top:32px;font-size:12px;color:#94a3b8">
                        Si tienes preguntas, responde este email.<br/>Qvisos.cl — Sin comisiones, sin intermediarios.
                    </p>
                </div>
            `,
        });
    } catch (err) {
        // No fatal: el anuncio ya fue aprobado, solo falla el email
        console.error('[email] sendAdApprovedEmail falló:', err);
    }
}

// --- NUEVO ANUNCIO PENDIENTE → admin ---
export async function sendNewAdPendingEmail(adTitle: string, adId: string) {
    try {
        await resend.emails.send({
            from: FROM,
            to: ADMIN_EMAIL,
            subject: `🔔 Nuevo anuncio por aprobar: ${adTitle}`,
            html: `
                <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b">
                    <h1 style="font-size:18px;font-weight:700;margin-bottom:8px">Nuevo anuncio pendiente de revisión</h1>
                    <p style="color:#475569;margin-bottom:8px">
                        <strong>${adTitle}</strong> acaba de ser publicado y espera tu aprobación.
                    </p>
                    <a href="${SITE_URL}/admin/dashboard"
                       style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none">
                        Ir al dashboard →
                    </a>
                    <p style="margin-top:24px;font-size:11px;color:#94a3b8">ID: ${adId}</p>
                </div>
            `,
        });
    } catch (err) {
        console.error('[email] sendNewAdPendingEmail falló:', err);
    }
}
