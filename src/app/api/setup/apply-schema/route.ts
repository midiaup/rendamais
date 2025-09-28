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
  console.log('🔧 Aplicando schema SQL completo...')
  
  try {
    // Ler o arquivo schema.sql
    const schemaPath = join(process.cwd(), '..', 'sql', 'schema.sql')
    const schemaContent = readFileSync(schemaPath, 'utf-8')
    
    console.log('📄 Schema SQL carregado:', schemaContent.length, 'caracteres')
    
    // Dividir o schema em comandos individuais
    const commands = schemaContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log('📋 Comandos SQL encontrados:', commands.length)
    
    const results = []
    
    // Executar cada comando individualmente
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';'
      console.log(`🔄 Executando comando ${i + 1}/${commands.length}...`)
      
      try {
        const { data, error } = await supabaseAdmin.rpc('exec', {
          sql: command
        })
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error)
          results.push({
            command: i + 1,
            success: false,
            error: error.message,
            sql: command.substring(0, 100) + '...'
          })
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
          results.push({
            command: i + 1,
            success: true,
            sql: command.substring(0, 100) + '...'
          })
        }
      } catch (cmdError) {
        console.error(`💥 Exceção no comando ${i + 1}:`, cmdError)
        results.push({
          command: i + 1,
          success: false,
          error: cmdError instanceof Error ? cmdError.message : 'Erro desconhecido',
          sql: command.substring(0, 100) + '...'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    console.log(`📊 Resultado: ${successCount} sucessos, ${errorCount} erros`)
    
    return NextResponse.json({
      success: errorCount === 0,
      message: `Schema aplicado: ${successCount} comandos executados, ${errorCount} erros`,
      results,
      summary: {
        total: commands.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('💥 Erro geral ao aplicar schema:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar se o schema já foi aplicado testando cada tabela individualmente
    const expectedTables = ['profiles', 'wallets', 'matrices', 'donations', 'donation_events', 'notifications']
    const existingTables = []
    const missingTables = []

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1)

        if (!error) {
          existingTables.push(tableName)
        } else if (error.code === 'PGRST116') {
          // Tabela não existe
          missingTables.push(tableName)
        } else {
          // Outro erro - assumir que a tabela existe mas há problema de permissão
          existingTables.push(tableName)
        }
      } catch (err) {
        missingTables.push(tableName)
      }
    }

    return NextResponse.json({
      applied: missingTables.length === 0,
      existingTables,
      missingTables,
      message: missingTables.length === 0 
        ? 'Schema completamente aplicado' 
        : `Faltam ${missingTables.length} tabelas: ${missingTables.join(', ')}`
    })

  } catch (error) {
    return NextResponse.json({
      applied: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}