import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Configuração do cliente Supabase com service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SQL da função get_recent_donations
const GET_RECENT_DONATIONS_SQL = `
CREATE OR REPLACE FUNCTION get_recent_donations(limit_count int DEFAULT 10)
RETURNS TABLE (
  donator_username text,
  receiver_username text,
  amount numeric,
  created_at timestamp with time zone,
  status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.username as donator_username,
    rp.username as receiver_username,
    d.amount,
    d.created_at,
    d.status
  FROM donations d
  JOIN profiles dp ON d.from_profile_id = dp.id
  JOIN profiles rp ON d.to_profile_id = rp.id
  WHERE d.status = 'confirmed'
  ORDER BY d.created_at DESC
  LIMIT limit_count;
END;
$$;
`

export async function POST() {
  console.log('🚀 Criando função get_recent_donations diretamente...')
  
  try {
    // Primeiro, vamos tentar uma abordagem mais simples
    // Usar uma query SQL direta através do cliente Supabase
    console.log('🔧 Tentando executar SQL via cliente Supabase...')
    
    // Tentar usar o método sql do cliente Supabase
    const { data, error } = await supabaseAdmin
      .from('profiles') // Usar uma tabela existente como base
      .select('*')
      .limit(0) // Não queremos dados, só testar a conexão
    
    if (error) {
      console.error('💥 Erro de conexão:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco de dados',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Conexão com o banco estabelecida')
    
    // Agora vamos tentar uma abordagem diferente
    // Usar o endpoint SQL direto do Supabase
    const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/exec`
    
    console.log('🔧 Tentando executar via endpoint SQL...')
    
    const response = await fetch(sqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sql: GET_RECENT_DONATIONS_SQL
      })
    })
    
    if (response.ok) {
      console.log('✅ Função criada com sucesso via endpoint SQL!')
      
      // Verificar se a função foi criada testando-a
      try {
        const { data: testData, error: testError } = await supabaseAdmin
          .rpc('get_recent_donations', { limit_count: 1 })
        
        if (testError) {
          console.log('⚠️ Função criada mas com erro no teste:', testError.message)
          return NextResponse.json({
            success: true,
            message: 'Função criada, mas com possível problema',
            warning: testError.message
          })
        } else {
          console.log('✅ Função criada e testada com sucesso!')
          return NextResponse.json({
            success: true,
            message: 'Função get_recent_donations criada e testada com sucesso',
            testData: testData
          })
        }
      } catch (testError) {
        console.log('⚠️ Função criada mas erro no teste:', testError)
        return NextResponse.json({
          success: true,
          message: 'Função criada, mas não foi possível testar',
          warning: testError instanceof Error ? testError.message : 'Erro no teste'
        })
      }
    } else {
      const errorData = await response.text()
      console.error('💥 Erro no endpoint SQL:', errorData)
      
      // Se o endpoint exec não funcionar, vamos tentar criar a função exec primeiro
      console.log('🔄 Tentando criar função exec primeiro...')
      
      const createExecSQL = `
        CREATE OR REPLACE FUNCTION exec(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `
      
      // Tentar uma abordagem mais básica usando uma query simples
      try {
        // Usar uma abordagem de "hack" - criar a função através de uma view temporária
        const hackResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept': 'application/vnd.pgrst.object+json'
          }
        })
        
        if (hackResponse.ok) {
          console.log('✅ Conexão PostgREST estabelecida')
          
          // Agora vamos tentar usar o psql através de uma requisição especial
          return NextResponse.json({
            success: false,
            message: 'Não foi possível criar a função automaticamente',
            suggestion: 'Execute manualmente no banco: ' + GET_RECENT_DONATIONS_SQL,
            sql: GET_RECENT_DONATIONS_SQL
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Falha na conexão com PostgREST',
            details: await hackResponse.text()
          }, { status: 500 })
        }
      } catch (hackError) {
        return NextResponse.json({
          success: false,
          error: 'Erro na tentativa alternativa',
          details: hackError instanceof Error ? hackError.message : 'Erro desconhecido',
          sql: GET_RECENT_DONATIONS_SQL
        }, { status: 500 })
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      sql: GET_RECENT_DONATIONS_SQL
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🔍 Verificando função get_recent_donations...')
  
  try {
    // Testar se a função existe
    const { data, error } = await supabaseAdmin
      .rpc('get_recent_donations', { limit_count: 1 })
    
    if (error) {
      if (error.message?.includes('Could not find the function')) {
        return NextResponse.json({
          exists: false,
          working: false,
          message: 'Função get_recent_donations não encontrada'
        })
      } else {
        return NextResponse.json({
          exists: true,
          working: false,
          message: 'Função existe mas com erro',
          error: error.message
        })
      }
    } else {
      return NextResponse.json({
        exists: true,
        working: true,
        message: 'Função get_recent_donations funcionando corretamente',
        sampleData: data
      })
    }
  } catch (error) {
    return NextResponse.json({
      exists: false,
      working: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar função'
    }, { status: 500 })
  }
}