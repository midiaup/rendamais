import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Configuração do cliente Supabase com service role para operações administrativas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST() {
  console.log('🔧 Configurando banco de dados...')
  
  try {
    // Testar conexão básica
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.log('❌ Erro de conexão:', connectionError)
      
      // Se a tabela não existe, vamos tentar criar dados de teste
      if (connectionError.code === 'PGRST116') {
        console.log('📝 Tabela profiles não existe, tentando criar dados de teste...')
        
        const testProfile = {
          user_id: '00000000-0000-0000-0000-000000000001',
          username: 'test_user',
          full_name: 'Usuário de Teste',
          email: 'test@example.com',
          country: 'BR'
        }
        
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert([testProfile])
        
        if (insertError) {
          console.error('❌ Erro ao inserir dados de teste:', insertError)
          return NextResponse.json({ 
            success: false, 
            error: insertError.message,
            details: insertError 
          }, { status: 500 })
        }
        
        console.log('✅ Dados de teste inseridos com sucesso')
        return NextResponse.json({ 
          success: true, 
          message: 'Banco configurado com dados de teste',
          action: 'created_test_data'
        })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: connectionError.message,
        details: connectionError 
      }, { status: 500 })
    }

    console.log('✅ Conexão com banco estabelecida')
    return NextResponse.json({ 
      success: true, 
      message: 'Banco de dados já configurado',
      action: 'verified_connection'
    })

  } catch (error) {
    console.error('💥 Erro geral na configuração do banco:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Testar conexão e retornar status
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        connected: false, 
        error: error.message,
        needsSetup: error.code === 'PGRST116'
      })
    }

    return NextResponse.json({ 
      connected: true, 
      message: 'Conexão estabelecida com sucesso' 
    })

  } catch (error) {
    return NextResponse.json({ 
      connected: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}