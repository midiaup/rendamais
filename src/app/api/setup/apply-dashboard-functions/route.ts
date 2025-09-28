import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Configuração do cliente Supabase com service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET() {
  console.log('🔍 Verificando status das funções do dashboard...')
  
  const functionsToCheck = [
    'get_user_dashboard_stats',
    'get_recent_donations'
  ]
  
  const existingFunctions = []
  const missingFunctions = []
  
  for (const funcName of functionsToCheck) {
    try {
      // Tentar executar uma query simples para verificar se a função existe
      const { error } = await supabaseAdmin.rpc(funcName, funcName === 'get_user_dashboard_stats' ? 
        { p_user_id: '00000000-0000-0000-0000-000000000000' } : 
        { limit_count: 1 }
      )
      
      if (error && error.code === 'PGRST202') {
        missingFunctions.push(funcName)
      } else {
        existingFunctions.push(funcName)
      }
    } catch (err) {
      missingFunctions.push(funcName)
    }
  }
  
  const allApplied = missingFunctions.length === 0
  
  return NextResponse.json({
    applied: allApplied,
    existingFunctions,
    missingFunctions,
    message: allApplied ? 
      'Todas as funções do dashboard estão aplicadas' : 
      `Faltam ${missingFunctions.length} funções: ${missingFunctions.join(', ')}`
  })
}

export async function POST() {
  console.log('🚀 Aplicando funções do dashboard...')
  
  try {
    // Ler o arquivo dashboard_functions.sql
    const sqlPath = join(process.cwd(), '..', 'sql', 'dashboard_functions.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')
    
    console.log('📄 Arquivo dashboard_functions.sql lido com sucesso')
    
    // Dividir em blocos de função (separados por linhas vazias ou comentários)
    const functionBlocks = sqlContent
      .split(/(?=create or replace function)/gi)
      .filter(block => block.trim().length > 0 && block.includes('create or replace function'))
    
    console.log(`📦 Encontrados ${functionBlocks.length} blocos de função`)
    
    const results = []
    
    for (let i = 0; i < functionBlocks.length; i++) {
      const functionBlock = functionBlocks[i].trim()
      
      if (!functionBlock) continue
      
      console.log(`🔧 Executando função ${i + 1}/${functionBlocks.length}...`)
      
      try {
        // Usar fetch direto para executar SQL via PostgREST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: functionBlock })
        })
        
        if (response.ok) {
          console.log(`✅ Função ${i + 1} executada com sucesso`)
          results.push({
            function: i + 1,
            success: true,
            sql: functionBlock.substring(0, 100) + '...'
          })
        } else {
          const errorData = await response.json()
          console.error(`❌ Erro na função ${i + 1}:`, errorData)
          results.push({
            function: i + 1,
            success: false,
            error: errorData.message || 'Erro desconhecido',
            sql: functionBlock.substring(0, 100) + '...'
          })
        }
      } catch (funcError) {
        console.error(`💥 Erro ao executar função ${i + 1}:`, funcError)
        results.push({
          function: i + 1,
          success: false,
          error: funcError instanceof Error ? funcError.message : 'Erro desconhecido',
          sql: functionBlock.substring(0, 100) + '...'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    return NextResponse.json({
      success: successCount === totalCount,
      message: `Aplicação concluída: ${successCount}/${totalCount} funções aplicadas com sucesso`,
      results,
      summary: {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount
      }
    })
    
  } catch (error) {
    console.error('💥 Erro ao aplicar funções do dashboard:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}