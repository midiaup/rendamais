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
  console.log('🧪 Testando funções SQL existentes...')
  
  const testResults = []
  
  // Teste 1: get_recent_donations
  try {
    console.log('🔍 Testando get_recent_donations...')
    const { data, error } = await supabaseAdmin.rpc('get_recent_donations', { 
      limit_count: 5 
    })
    
    if (error) {
      testResults.push({
        function: 'get_recent_donations',
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      testResults.push({
        function: 'get_recent_donations',
        success: true,
        result: data,
        count: data?.length || 0
      })
    }
  } catch (err) {
    testResults.push({
      function: 'get_recent_donations',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    })
  }
  
  // Teste 2: auto_confirm_donations
  try {
    console.log('🔍 Testando auto_confirm_donations...')
    const { data, error } = await supabaseAdmin.rpc('auto_confirm_donations')
    
    if (error) {
      testResults.push({
        function: 'auto_confirm_donations',
        success: false,
        error: error.message,
        code: error.code
      })
    } else {
      testResults.push({
        function: 'auto_confirm_donations',
        success: true,
        result: 'Função executada com sucesso'
      })
    }
  } catch (err) {
    testResults.push({
      function: 'auto_confirm_donations',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    })
  }
  
  // Teste 3: Verificar se allocate_profile_in_matrix_complete existe
  try {
    console.log('🔍 Testando allocate_profile_in_matrix_complete...')
    // Esta função requer parâmetros específicos, então vamos apenas verificar se existe
    const { data, error } = await supabaseAdmin.rpc('allocate_profile_in_matrix_complete', {
      p_profile_id_to_place: '00000000-0000-0000-0000-000000000000',
      p_matrix_type: 'test'
    })
    
    if (error && error.code === 'PGRST202') {
      testResults.push({
        function: 'allocate_profile_in_matrix_complete',
        success: false,
        error: 'Função não encontrada',
        code: error.code
      })
    } else {
      testResults.push({
        function: 'allocate_profile_in_matrix_complete',
        success: true,
        result: 'Função existe (pode ter falhado por parâmetros inválidos, mas existe)'
      })
    }
  } catch (err) {
    testResults.push({
      function: 'allocate_profile_in_matrix_complete',
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido'
    })
  }
  
  // Teste 4: Verificar tabelas básicas
  const tableTests = []
  const tables = ['profiles', 'wallets', 'matrices', 'donations', 'donation_events', 'notifications']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        tableTests.push({
          table,
          success: false,
          error: error.message
        })
      } else {
        tableTests.push({
          table,
          success: true,
          count: data?.length || 0
        })
      }
    } catch (err) {
      tableTests.push({
        table,
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      })
    }
  }
  
  const successfulFunctions = testResults.filter(r => r.success).length
  const successfulTables = tableTests.filter(r => r.success).length
  
  return NextResponse.json({
    success: successfulFunctions > 0 && successfulTables === tables.length,
    message: `Teste concluído: ${successfulFunctions}/${testResults.length} funções OK, ${successfulTables}/${tables.length} tabelas OK`,
    functions: testResults,
    tables: tableTests,
    summary: {
      functionsTotal: testResults.length,
      functionsSuccess: successfulFunctions,
      tablesTotal: tables.length,
      tablesSuccess: successfulTables
    }
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para executar os testes das funções SQL',
    availableTests: [
      'get_recent_donations',
      'auto_confirm_donations', 
      'allocate_profile_in_matrix_complete',
      'tabelas básicas'
    ]
  })
}