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

// Definições das funções SQL que queremos criar
const DASHBOARD_FUNCTIONS = {
  get_user_dashboard_stats: `
    CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id uuid)
    RETURNS TABLE (user_status text, user_level int)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_profile_id uuid;
    BEGIN
      -- Get profile_id from user_id
      SELECT id INTO v_profile_id FROM profiles WHERE user_id = p_user_id LIMIT 1;

      RETURN QUERY 
      SELECT 
        -- Status Logic: Active if at least one confirmed donation has been made
        CASE 
          WHEN EXISTS(SELECT 1 FROM donations WHERE from_profile_id = v_profile_id AND status = 'confirmed') 
          THEN 'Ativo' 
          ELSE 'Inativo' 
        END as user_status,

        -- Level Logic: Count of direct referrals
        (SELECT count(*) FROM profiles WHERE referrer_user_id = p_user_id)::int as user_level;

    END; 
    $$;
  `,
  
  get_recent_donations: `
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
}

export async function POST() {
  console.log('🚀 Aplicando funções do dashboard manualmente...')
  
  try {
    const results = []
    let successCount = 0
    
    for (const [functionName, functionSQL] of Object.entries(DASHBOARD_FUNCTIONS)) {
      console.log(`🔧 Aplicando função: ${functionName}`)
      
      try {
        // Tentar usar uma abordagem mais direta com o cliente Supabase
        // Vamos usar uma query SQL simples para testar a conexão primeiro
        const { data: testData, error: testError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .limit(1)
        
        if (testError) {
          console.error('💥 Erro de conexão:', testError)
          results.push({
            function: functionName,
            success: false,
            error: 'Erro de conexão com o banco',
            details: testError.message
          })
          continue
        }
        
        // Agora vamos tentar uma abordagem diferente
        // Usar o PostgREST diretamente com uma requisição HTTP
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.pgrst.object+json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Accept': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: functionSQL
          })
        })
        
        if (response.ok || response.status === 201) {
          console.log(`✅ Função ${functionName} aplicada com sucesso!`)
          successCount++
          results.push({
            function: functionName,
            success: true,
            message: 'Função criada com sucesso'
          })
        } else {
          const errorData = await response.text()
          console.error(`💥 Erro ao aplicar ${functionName}:`, errorData)
          
          // Tentar uma abordagem alternativa usando uma migration temporária
          console.log(`🔄 Tentando abordagem alternativa para ${functionName}...`)
          
          try {
            // Criar uma "migration" temporária usando o endpoint de migrations
            const migrationResponse = await fetch(`${supabaseUrl}/rest/v1/migrations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({
                name: `create_${functionName}_${Date.now()}`,
                sql: functionSQL
              })
            })
            
            if (migrationResponse.ok) {
              console.log(`✅ Função ${functionName} aplicada via migration!`)
              successCount++
              results.push({
                function: functionName,
                success: true,
                message: 'Função criada via migration',
                method: 'migration'
              })
            } else {
              const migrationError = await migrationResponse.text()
              console.error(`💥 Erro na migration para ${functionName}:`, migrationError)
              
              results.push({
                function: functionName,
                success: false,
                error: 'Falha em ambas as abordagens',
                details: {
                  direct: errorData,
                  migration: migrationError
                }
              })
            }
          } catch (migrationError) {
            results.push({
              function: functionName,
              success: false,
              error: 'Erro na abordagem alternativa',
              details: migrationError instanceof Error ? migrationError.message : 'Erro desconhecido'
            })
          }
        }
      } catch (functionError) {
        console.error(`💥 Erro geral na função ${functionName}:`, functionError)
        results.push({
          function: functionName,
          success: false,
          error: functionError instanceof Error ? functionError.message : 'Erro desconhecido'
        })
      }
    }
    
    const totalFunctions = Object.keys(DASHBOARD_FUNCTIONS).length
    
    return NextResponse.json({
      success: successCount === totalFunctions,
      message: `Aplicação concluída: ${successCount}/${totalFunctions} funções aplicadas com sucesso`,
      results,
      summary: {
        total: totalFunctions,
        success: successCount,
        failed: totalFunctions - successCount
      }
    })
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🔍 Verificando funções do dashboard...')
  
  try {
    const results = []
    
    for (const functionName of Object.keys(DASHBOARD_FUNCTIONS)) {
      try {
        // Tentar executar cada função para ver se existe
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify(
            functionName === 'get_user_dashboard_stats' 
              ? { p_user_id: '00000000-0000-0000-0000-000000000000' }
              : { limit_count: 1 }
          )
        })
        
        if (response.ok) {
          results.push({
            function: functionName,
            exists: true,
            working: true
          })
        } else if (response.status === 404) {
          results.push({
            function: functionName,
            exists: false,
            working: false
          })
        } else {
          const errorData = await response.json()
          results.push({
            function: functionName,
            exists: true,
            working: false,
            error: errorData.message
          })
        }
      } catch (error) {
        results.push({
          function: functionName,
          exists: false,
          working: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }
    
    const existingCount = results.filter(r => r.exists).length
    const workingCount = results.filter(r => r.working).length
    
    return NextResponse.json({
      message: `Status das funções: ${existingCount}/${results.length} existem, ${workingCount}/${results.length} funcionando`,
      functions: results,
      summary: {
        total: results.length,
        existing: existingCount,
        working: workingCount
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro ao verificar funções'
    }, { status: 500 })
  }
}