import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: Request) {
  console.log('🚀 Aplicando SQL via Management API...')
  
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
    
    // Usar o Management API do Supabase para aplicar a migration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Extrair o project ID da URL
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Não foi possível extrair o project ID da URL do Supabase'
      }, { status: 400 })
    }
    
    console.log(`🔧 Aplicando SQL para projeto ${projectId}...`)
    
    // Criar uma migration temporária
    const migrationName = `apply_${sqlFile.replace('.sql', '')}_${Date.now()}`
    
    try {
      // Usar a API de migrations do Supabase
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/migrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          name: migrationName,
          query: sqlContent
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('💥 Erro na API de migrations:', errorData)
        
        // Se a API de migrations não funcionar, vamos tentar uma abordagem mais simples
        // Executar SQL diretamente via PostgREST
        console.log('🔄 Tentando execução direta via PostgREST...')
        
        // Dividir o SQL em comandos individuais
        const commands = sqlContent
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 10 && !cmd.startsWith('--'))
        
        const results = []
        let successCount = 0
        
        for (let i = 0; i < commands.length; i++) {
          const command = commands[i]
          
          try {
            // Tentar executar via PostgREST diretamente
            const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ sql: command })
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
              
              // Se o erro for sobre função não encontrada, vamos tentar criar a função exec
              if (errorData.message?.includes('Could not find the function public.exec')) {
                console.log('🔧 Tentando criar função exec...')
                
                const createExecFunction = `
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
                
                // Tentar criar a função exec via SQL direto
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/query`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey
                  },
                  body: JSON.stringify({ query: createExecFunction })
                })
                
                if (createResponse.ok) {
                  console.log('✅ Função exec criada com sucesso!')
                  
                  // Tentar executar o comando novamente
                  const retryResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseServiceKey}`,
                      'apikey': supabaseServiceKey
                    },
                    body: JSON.stringify({ sql: command })
                  })
                  
                  if (retryResponse.ok) {
                    successCount++
                    results.push({
                      command: i + 1,
                      success: true,
                      sql: command.substring(0, 100) + '...',
                      note: 'Executado após criar função exec'
                    })
                  } else {
                    const retryErrorData = await retryResponse.json()
                    results.push({
                      command: i + 1,
                      success: false,
                      error: retryErrorData.message || 'Erro na segunda tentativa',
                      sql: command.substring(0, 100) + '...'
                    })
                  }
                } else {
                  results.push({
                    command: i + 1,
                    success: false,
                    error: 'Não foi possível criar função exec',
                    sql: command.substring(0, 100) + '...'
                  })
                }
              } else {
                results.push({
                  command: i + 1,
                  success: false,
                  error: errorData.message || 'Erro desconhecido',
                  sql: command.substring(0, 100) + '...'
                })
              }
            }
          } catch (cmdError) {
            results.push({
              command: i + 1,
              success: false,
              error: cmdError instanceof Error ? cmdError.message : 'Erro desconhecido',
              sql: command.substring(0, 100) + '...'
            })
          }
        }
        
        return NextResponse.json({
          success: successCount > 0,
          message: `${description || 'Aplicação'} concluída: ${successCount}/${commands.length} comandos executados com sucesso`,
          results,
          summary: {
            total: commands.length,
            success: successCount,
            failed: commands.length - successCount
          },
          note: 'Executado via PostgREST direto (Management API não disponível)'
        })
      }
      
      const migrationData = await response.json()
      console.log('✅ Migration aplicada com sucesso:', migrationData)
      
      return NextResponse.json({
        success: true,
        message: `${description || 'Aplicação'} concluída com sucesso via Management API`,
        migration: migrationData
      })
      
    } catch (apiError) {
      console.error('💥 Erro na API:', apiError)
      
      return NextResponse.json({
        success: false,
        error: apiError instanceof Error ? apiError.message : 'Erro na API'
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
    message: 'Use POST para aplicar arquivos SQL via Management API',
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