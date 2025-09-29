import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface Movement {
  id: string;
  profile_id: string | null;
  amount: number;
  status?: string | null;
  direction?: string | null;
  created_at: string;
  reference?: string | null;
  tx_hash?: string | null;
}

type MaybeMovementResponse = Movement[] | null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get('days') ?? '30');
  const limit = Number(searchParams.get('limit') ?? '100');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const warnings: string[] = [];

    const { data: pixMovements, error: pixError } = await supabaseAdmin
      .from('pix_movements')
      .select('id, profile_id, amount, status, direction, created_at, reference')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    let pix: MaybeMovementResponse = pixMovements;

    if (pixError) {
      if ('code' in pixError && pixError.code === 'PGRST116') {
        warnings.push('Tabela pix_movements não encontrada.');
        pix = [];
      } else {
        throw new Error(pixError.message);
      }
    }

    const { data: usdtMovements, error: usdtError } = await supabaseAdmin
      .from('usdt_movements')
      .select('id, profile_id, amount, status, direction, created_at, tx_hash')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    let usdt: MaybeMovementResponse = usdtMovements;

    if (usdtError) {
      if ('code' in usdtError && usdtError.code === 'PGRST116') {
        warnings.push('Tabela usdt_movements não encontrada.');
        usdt = [];
      } else {
        throw new Error(usdtError.message);
      }
    }

    const safePix = Array.isArray(pix) ? pix : [];
    const safeUsdt = Array.isArray(usdt) ? usdt : [];

    const pixTotal = safePix.reduce((acc, mov) => acc + (mov.amount ?? 0), 0);
    const usdtTotal = safeUsdt.reduce((acc, mov) => acc + (mov.amount ?? 0), 0);

    return NextResponse.json({
      success: true,
      warnings,
      totals: {
        pix: pixTotal,
        usdt: usdtTotal,
        combined: pixTotal + usdtTotal,
      },
      pix: safePix,
      usdt: safeUsdt,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de pagamentos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar relatório.',
    }, { status: 500 });
  }
}
