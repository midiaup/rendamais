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
  console.log('🚀 Aplicando migration das funções do dashboard...')
  
  try {
    // Ler o arquivo de migration
    const migrationPath = join(process.cwd(), '..', 'supabase', 'migrations', '20250127000001_create_dashboard_functions.sql')
    console.log('📁 Lendo migration de:', migrationPath)
    
    let migrationSQL: string
    try {
      migrationSQL = readFileSync(migrationPath, 'utf8')
      console.log('✅ Migration carregada com sucesso')
    } catch (fileError) {
      console.error('💥 Erro ao ler arquivo de migration:', fileError)
      return NextResponse.json({
        success: false,
        error: 'Não foi possível ler o arquivo de migration',
        details: fileError instanceof Error ? fileError.message : 'Erro desconhecido'
      }, { status: 500 })
    }
    
    // Dividir o SQL em comandos individuais
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Encontrados ${sqlCommands.length} comandos SQL para executar`)
    
    const results = []
    let successCount = 0
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      console.log(`🔧 Executando comando ${i + 1}/${sqlCommands.length}`)
      
      try {
        // Usar o método query do Supabase para executar SQL raw
        const { data, error } = await supabaseAdmin.rpc('query', {
          query: command + ';'
        })
        
        if (error) {
          console.error(`💥 Erro no comando ${i + 1}:`, error)
          
          // Se o erro for sobre função não encontrada, tentar uma abordagem alternativa
          if (error.message?.includes('Could not find the function')) {
            console.log(`🔄 Tentando abordagem alternativa para comando ${i + 1}...`)
            
            // Tentar usar uma requisição HTTP direta
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/sql',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Accept': 'application/json'
              },
              body: command + ';'
            })
            
            if (response.ok) {
              console.log(`✅ Comando ${i + 1} executado com sucesso via HTTP`)
              successCount++
              results.push({
                command: i + 1,
                success: true,
                method: 'HTTP direct'
              })
            } else {
              const errorData = await response.text()
              console.error(`💥 Erro HTTP no comando ${i + 1}:`, errorData)
              results.push({
                command: i + 1,
                success: false,
                error: errorData,
                method: 'HTTP direct'
              })
            }
          } else {
            results.push({
              command: i + 1,
              success: false,
              error: error.message,
              method: 'Supabase RPC'
            })
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
          successCount++
          results.push({
            command: i + 1,
            success: true,
            method: 'Supabase RPC'
          })
        }
      } catch (commandError) {
        console.error(`💥 Erro geral no comando ${i + 1}:`, commandError)
        results.push({
          command: i + 1,
          success: false,
          error: commandError instanceof Error ? commandError.message : 'Erro desconhecido',
          method: 'Exception'
        })
      }
    }
    
    console.log(`🎯 Resultado final: ${successCount}/${sqlCommands.length} comandos executados com sucesso`)
    
    return NextResponse.json({
      success: successCount === sqlCommands.length,
      message: `Migration aplicada: ${successCount}/${sqlCommands.length} comandos executados com sucesso`,
      results,
      summary: {
        total: sqlCommands.length,
        success: successCount,
        failed: sqlCommands.length - successCount
      }
    })
    
  } catch (error) {
    console.error('💥 Erro geral na aplicação da migration:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🔍 Verificando status da migration...')
  
  try {
    // Verificar se as funções existem
    const functions = ['get_user_dashboard_stats', 'get_recent_donations']
    const results = []
    
    for (const functionName of functions) {
      try {
        // Tentar executar a função para verificar se existe
        const testParams = functionName === 'get_user_dashboard_stats' 
          ? { p_user_id: '00000000-0000-0000-0000-000000000000' }
          : { limit_count: 1 }
        
        const { data, error } = await supabaseAdmin.rpc(functionName, testParams)
        
        if (error) {
          if (error.message?.includes('Could not find the function')) {
            results.push({
              function: functionName,
              exists: false,
              working: false
            })
          } else {
            results.push({
              function: functionName,
              exists: true,
              working: false,
              error: error.message
            })
          }
        } else {
          results.push({
            function: functionName,
            exists: true,
            working: true,
            data: data
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
      error: error instanceof Error ? error.message : 'Erro ao verificar migration'
    }, { status: 500 })
  }
}