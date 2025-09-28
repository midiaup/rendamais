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

export async function POST(request: Request) {
  console.log('🚀 Aplicando SQL diretamente...')
  
  try {
    const { sqlFile, description } = await request.json()
    
    if (!sqlFile) {
      return NextResponse.json({
        success: false,
        error: 'Nome do arquivo SQL é obrigatório'
      }, { status: 400 })
    }
    
    // Ler o arquivo SQL
    const sqlPath = join(process.cwd(), '..', 'sql', sqlFile)
    const sqlContent = readFileSync(sqlPath, 'utf-8')
    
    console.log(`📄 Arquivo ${sqlFile} lido com sucesso`)
    
    // Dividir em comandos individuais (separados por ponto e vírgula)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📦 Encontrados ${commands.length} comandos SQL`)
    
    const results = []
    let successCount = 0
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      if (!command || command.length < 10) continue
      
      console.log(`🔧 Executando comando ${i + 1}/${commands.length}...`)
      
      try {
        // Usar uma query SQL simples para executar DDL
        const { data, error } = await supabaseAdmin
          .from('_dummy_table_for_sql_execution')
          .select('*')
          .limit(0)
        
        // Como não podemos usar exec, vamos tentar uma abordagem com rpc personalizada
        // Primeiro, vamos tentar criar uma função temporária para executar SQL
        const tempFunctionName = `temp_exec_${Date.now()}_${i}`
        const wrapperSQL = `
          CREATE OR REPLACE FUNCTION ${tempFunctionName}() 
          RETURNS void 
          LANGUAGE plpgsql 
          AS $$ 
          BEGIN 
            ${command.replace(/'/g, "''")}; 
          END; 
          $$;
        `
        
        // Tentar executar via PostgREST diretamente
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${tempFunctionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({})
        })
        
        if (response.ok || response.status === 404) {
          // Se deu 404, significa que a função não existe, então vamos tentar criar ela primeiro
          if (response.status === 404) {
            // Tentar criar a função wrapper primeiro
            const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql: wrapperSQL })
            })
            
            if (createResponse.ok) {
              // Agora executar a função
              const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/${tempFunctionName}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey
                },
                body: JSON.stringify({})
              })
              
              if (execResponse.ok) {
                successCount++
                results.push({
                  command: i + 1,
                  success: true,
                  sql: command.substring(0, 100) + '...'
                })
              } else {
                const errorData = await execResponse.json()
                results.push({
                  command: i + 1,
                  success: false,
                  error: errorData.message || 'Erro na execução',
                  sql: command.substring(0, 100) + '...'
                })
              }
              
              // Limpar a função temporária
              await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ sql: `DROP FUNCTION IF EXISTS ${tempFunctionName}()` })
              })
            } else {
              results.push({
                command: i + 1,
                success: false,
                error: 'Não foi possível criar função wrapper',
                sql: command.substring(0, 100) + '...'
              })
            }
          } else {
            successCount++
            results.push({
              command: i + 1,
              success: true,
              sql: command.substring(0, 100) + '...'
            })
          }
        } else {
          const errorData = await response.json()
          results.push({
            command: i + 1,
            success: false,
            error: errorData.message || 'Erro desconhecido',
            sql: command.substring(0, 100) + '...'
          })
        }
      } catch (cmdError) {
        console.error(`💥 Erro no comando ${i + 1}:`, cmdError)
        results.push({
          command: i + 1,
          success: false,
          error: cmdError instanceof Error ? cmdError.message : 'Erro desconhecido',
          sql: command.substring(0, 100) + '...'
        })
      }
    }
    
    return NextResponse.json({
      success: successCount === commands.length,
      message: `${description || 'Aplicação'} concluída: ${successCount}/${commands.length} comandos executados com sucesso`,
      results,
      summary: {
        total: commands.length,
        success: successCount,
        failed: commands.length - successCount
      }
    })
    
  } catch (error) {
    console.error('💥 Erro ao aplicar SQL:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para aplicar arquivos SQL',
    usage: {
      method: 'POST',
      body: {
        sqlFile: 'nome_do_arquivo.sql',
        description: 'Descrição opcional da operação'
      }
    },
    availableFiles: [
      'functions.sql',
      'dashboard_functions.sql',
      'schema.sql'
    ]
  })
}