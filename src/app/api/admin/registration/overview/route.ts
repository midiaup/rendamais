import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Totals {
  active: number;
  inactive: number;
  byStatus: Record<string, number>;
}

export async function GET() {
  try {
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, status, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const totals = (profileData ?? []).reduce<Totals>((acc, profile) => {
      const status = (profile.status || '').toLowerCase();
      const isActive = profile.is_active ?? (status === 'active');

      if (isActive) {
        acc.active += 1;
      } else {
        acc.inactive += 1;
      }

      if (status) {
        acc.byStatus[status] = (acc.byStatus[status] ?? 0) + 1;
      }

      return acc;
    }, {
      active: 0,
      inactive: 0,
      byStatus: {},
    });

    const { data: flows, error: flowsError } = await supabaseAdmin
      .from('registration_flows')
      .select('id, profile_id, status, is_active, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (flowsError) {
      throw new Error(flowsError.message);
    }

    const { data: events, error: eventsError } = await supabaseAdmin
      .from('registration_flow_events')
      .select('id, flow_id, event_type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      throw new Error(eventsError.message);
    }

    return NextResponse.json({
      success: true,
      totals,
      profiles: profileData ?? [],
      flows: flows ?? [],
      events: events ?? [],
    });
  } catch (error) {
    console.error('Erro ao obter panorama de cadastros:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao consultar fluxos de cadastro.',
    }, { status: 500 });
  }
}
