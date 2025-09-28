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
  console.log('🚀 Aplicando SQL via query direta...')
  
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
    
    // Para funções, vamos executar o arquivo inteiro de uma vez
    // Isso funciona melhor para CREATE OR REPLACE FUNCTION
    try {
      console.log('🔧 Executando SQL completo...')
      
      // Usar o método query do Supabase que permite SQL raw
      const { data, error } = await supabaseAdmin
        .rpc('exec', { sql: sqlContent })
      
      if (error) {
        console.error('💥 Erro na execução:', error)
        
        // Se o erro for sobre a função exec não existir, vamos tentar uma abordagem diferente
        if (error.message?.includes('Could not find the function public.exec')) {
          console.log('🔄 Tentando abordagem alternativa...')
          
          // Vamos tentar executar cada função individualmente usando uma abordagem mais direta
          const functions = sqlContent.split('create or replace function').filter(f => f.trim())
          const results = []
          let successCount = 0
          
          for (let i = 0; i < functions.length; i++) {
            if (i === 0 && !functions[i].includes('function')) continue // Skip primeira parte vazia
            
            const functionSQL = 'create or replace function' + functions[i]
            const functionName = functionSQL.match(/function\s+(\w+)/)?.[1] || `function_${i}`
            
            try {
              // Tentar usar uma query SQL direta via fetch
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ query: functionSQL })
              })
              
              if (response.ok) {
                successCount++
                results.push({
                  function: functionName,
                  success: true,
                  sql: functionSQL.substring(0, 100) + '...'
                })
              } else {
                const errorData = await response.json()
                results.push({
                  function: functionName,
                  success: false,
                  error: errorData.message || 'Erro na execução',
                  sql: functionSQL.substring(0, 100) + '...'
                })
              }
            } catch (funcError) {
              results.push({
                function: functionName,
                success: false,
                error: funcError instanceof Error ? funcError.message : 'Erro desconhecido',
                sql: functionSQL.substring(0, 100) + '...'
              })
            }
          }
          
          return NextResponse.json({
            success: successCount > 0,
            message: `${description || 'Aplicação'} concluída: ${successCount}/${functions.length - 1} funções aplicadas com sucesso`,
            results,
            summary: {
              total: functions.length - 1,
              success: successCount,
              failed: (functions.length - 1) - successCount
            },
            note: 'Usada abordagem alternativa devido à indisponibilidade da função exec'
          })
        }
        
        return NextResponse.json({
          success: false,
          error: error.message,
          details: error
        }, { status: 500 })
      }
      
      console.log('✅ SQL executado com sucesso!')
      
      return NextResponse.json({
        success: true,
        message: `${description || 'Aplicação'} concluída com sucesso`,
        data
      })
      
    } catch (execError) {
      console.error('💥 Erro na execução do SQL:', execError)
      
      return NextResponse.json({
        success: false,
        error: execError instanceof Error ? execError.message : 'Erro na execução do SQL'
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