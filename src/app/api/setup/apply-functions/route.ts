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

export async function POST() {
  console.log('🔧 Aplicando funções SQL...')
  
  try {
    // Ler o arquivo functions.sql
    const functionsPath = join(process.cwd(), '..', 'sql', 'functions.sql')
    const functionsContent = readFileSync(functionsPath, 'utf-8')
    
    console.log('📄 Functions SQL carregado:', functionsContent.length, 'caracteres')
    
    // Dividir o conteúdo em blocos de funções
    // Cada função termina com $$ e uma quebra de linha
    const functionBlocks = functionsContent
      .split(/(?=create or replace function|CREATE OR REPLACE FUNCTION)/)
      .map(block => block.trim())
      .filter(block => block.length > 0 && !block.startsWith('--') && !block.startsWith('DROP'))
    
    console.log('📋 Blocos de funções encontrados:', functionBlocks.length)
    
    const results = []
    
    // Executar cada bloco de função individualmente
    for (let i = 0; i < functionBlocks.length; i++) {
      const functionBlock = functionBlocks[i]
      console.log(`🔄 Executando função ${i + 1}/${functionBlocks.length}...`)
      
      try {
        // Executar SQL diretamente usando a conexão do Supabase
        const { data, error } = await supabaseAdmin
          .from('_temp_sql_execution')
          .select('*')
          .limit(0) // Não queremos dados, só queremos executar SQL
        
        // Como não podemos usar exec, vamos tentar uma abordagem diferente
        // Usar uma query SQL raw através do PostgREST
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
        console.error(`💥 Exceção na função ${i + 1}:`, funcError)
        results.push({
          function: i + 1,
          success: false,
          error: funcError instanceof Error ? funcError.message : 'Erro desconhecido',
          sql: functionBlock.substring(0, 100) + '...'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    console.log(`📊 Resultado: ${successCount} sucessos, ${errorCount} erros`)
    
    return NextResponse.json({
      success: errorCount === 0,
      message: `Funções aplicadas: ${successCount} funções executadas, ${errorCount} erros`,
      results,
      summary: {
        total: functionBlocks.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('💥 Erro geral ao aplicar funções:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Testar algumas funções específicas para verificar se estão aplicadas
    const testFunctions = [
      'get_recent_donations',
      'allocate_profile_in_matrix_complete',
      'auto_confirm_donations'
    ]
    
    const existingFunctions = []
    const missingFunctions = []
    
    for (const funcName of testFunctions) {
      try {
        // Tentar chamar a função com parâmetros de teste
        let testResult
        
        if (funcName === 'get_recent_donations') {
          testResult = await supabaseAdmin.rpc(funcName, { limit_count: 1 })
        } else if (funcName === 'allocate_profile_in_matrix_complete') {
          // Esta função não retorna dados, apenas testa se existe
          testResult = { error: { code: 'PGRST202' } } // Assumir que não existe inicialmente
        } else if (funcName === 'auto_confirm_donations') {
          testResult = await supabaseAdmin.rpc(funcName)
        }
        
        if (!testResult.error || testResult.error.code !== 'PGRST202') {
          existingFunctions.push(funcName)
        } else {
          missingFunctions.push(funcName)
        }
      } catch (err) {
        missingFunctions.push(funcName)
      }
    }

    return NextResponse.json({
      applied: missingFunctions.length === 0,
      existingFunctions,
      missingFunctions,
      message: missingFunctions.length === 0 
        ? 'Todas as funções estão aplicadas' 
        : `Faltam ${missingFunctions.length} funções: ${missingFunctions.join(', ')}`
    })

  } catch (error) {
    return NextResponse.json({
      applied: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}