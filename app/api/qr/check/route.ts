import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('qr_codes')
            .select('category, status')
            .eq('code', code)
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            // Si es error "row not found", devolvemos null category sin explotar
            if (error.code === 'PGRST116') return NextResponse.json({ category: null });
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!data) return NextResponse.json({ category: null });

        if (data.status !== 'printed') {
            return NextResponse.json({ category: null, reason: 'invalid_status' });
        }

        return NextResponse.json({ category: data.category });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
