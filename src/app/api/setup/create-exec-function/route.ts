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

export async function POST() {
  console.log('🚀 Criando função exec no banco de dados...')
  
  try {
    // SQL para criar a função exec
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
    
    console.log('🔧 Tentando criar função exec...')
    
    // Tentar usar uma query SQL direta
    const { data, error } = await supabaseAdmin
      .from('profiles') // Usar uma tabela existente para fazer a query
      .select('id')
      .limit(0)
    
    if (error) {
      console.error('💥 Erro ao conectar:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco',
        details: error
      }, { status: 500 })
    }
    
    // Tentar executar via PostgREST usando uma abordagem diferente
    try {
      // Primeiro, vamos tentar criar uma função temporária que cria a função exec
      const tempCreateSQL = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'exec' 
            AND pg_get_function_identity_arguments(oid) = 'sql text'
          ) THEN
            EXECUTE '
              CREATE OR REPLACE FUNCTION exec(sql text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $func$
              BEGIN
                EXECUTE sql;
              END;
              $func$;
            ';
          END IF;
        END
        $$;
      `
      
      // Tentar executar via fetch direto
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ query: tempCreateSQL })
      })
      
      if (response.ok) {
        console.log('✅ Função exec criada com sucesso!')
        
        // Testar se a função foi criada
        const testResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: 'SELECT 1' })
        })
        
        if (testResponse.ok) {
          return NextResponse.json({
            success: true,
            message: 'Função exec criada e testada com sucesso!',
            note: 'Agora você pode usar as outras APIs para aplicar SQL'
          })
        } else {
          const testError = await testResponse.json()
          return NextResponse.json({
            success: false,
            message: 'Função exec foi criada mas falhou no teste',
            error: testError.message,
            note: 'Pode ser um problema de permissões'
          })
        }
      } else {
        const errorData = await response.json()
        console.error('💥 Erro ao criar função exec:', errorData)
        
        // Tentar uma abordagem mais simples
        console.log('🔄 Tentando abordagem alternativa...')
        
        // Usar o cliente Supabase para executar uma query raw
        const { data: execData, error: execError } = await supabaseAdmin
          .rpc('query', { query: createExecSQL })
        
        if (execError) {
          console.error('💥 Erro na segunda tentativa:', execError)
          
          return NextResponse.json({
            success: false,
            message: 'Não foi possível criar a função exec',
            error: execError.message,
            attempts: [
              { method: 'PostgREST query', error: errorData.message },
              { method: 'Supabase RPC query', error: execError.message }
            ]
          }, { status: 500 })
        } else {
          return NextResponse.json({
            success: true,
            message: 'Função exec criada com sucesso via RPC query!',
            data: execData
          })
        }
      }
    } catch (fetchError) {
      console.error('💥 Erro na requisição:', fetchError)
      
      return NextResponse.json({
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Erro na requisição'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🔍 Verificando se a função exec existe...')
  
  try {
    // Tentar executar a função exec com um comando simples
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: 'SELECT 1' })
    })
    
    if (response.ok) {
      return NextResponse.json({
        exists: true,
        message: 'Função exec existe e está funcionando!'
      })
    } else {
      const errorData = await response.json()
      
      if (errorData.message?.includes('Could not find the function public.exec')) {
        return NextResponse.json({
          exists: false,
          message: 'Função exec não existe',
          suggestion: 'Use POST para criar a função exec'
        })
      } else {
        return NextResponse.json({
          exists: true,
          working: false,
          message: 'Função exec existe mas não está funcionando corretamente',
          error: errorData.message
        })
      }
    }
  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar função exec'
    }, { status: 500 })
  }
}