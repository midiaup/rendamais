import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface ChatMessagePayload {
  threadId: string;
  message: string;
  closeThread?: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');

  try {
    if (threadId) {
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('id, thread_id, sender_type, message, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true, messages: data ?? [] });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_threads')
      .select('id, profile_id, subject, status, created_at, updated_at, unread_count')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, threads: data ?? [] });
  } catch (error) {
    console.error('Erro ao consultar chat:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao consultar mensagens.',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatMessagePayload;
    const { threadId, message, closeThread } = body;

    if (!threadId || !message) {
      return NextResponse.json({
        success: false,
        error: 'Thread e mensagem são obrigatórios.',
      }, { status: 400 });
    }

    const { error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        sender_type: 'admin',
        message,
      });

    if (messageError) {
      throw new Error(messageError.message);
    }

    if (closeThread) {
      const { error: threadError } = await supabaseAdmin
        .from('chat_threads')
        .update({ status: 'closed' })
        .eq('id', threadId);

      if (threadError) {
        throw new Error(threadError.message);
      }
    } else {
      const { error: threadUpdateError } = await supabaseAdmin
        .from('chat_threads')
        .update({ status: 'active', unread_count: 0 })
        .eq('id', threadId);

      if (threadUpdateError) {
        throw new Error(threadUpdateError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao responder chat:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar resposta.',
    }, { status: 500 });
  }
}
