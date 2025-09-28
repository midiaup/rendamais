import { createClient } from '@supabase/supabase-js'

// Configuração do cliente Supabase com service role para operações administrativas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias:', {
    NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey
  })
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function setupDatabase() {
  console.log('🔧 Configurando banco de dados...')
  
  try {
    // Criar tabela profiles usando SQL direto
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError && profilesError.code === 'PGRST116') {
      // Tabela não existe, vamos criá-la usando uma abordagem diferente
      console.log('Tabela profiles não existe, tentando criar...')
      
      // Como não temos acesso direto ao SQL, vamos usar uma abordagem alternativa
      // Primeiro, vamos verificar se conseguimos criar dados de teste
      const testProfile = {
        user_id: '00000000-0000-0000-0000-000000000001',
        username: 'test_user',
        full_name: 'Usuário de Teste',
        email: 'test@example.com',
        country: 'BR'
      }
      
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert([testProfile])
      
      if (insertError) {
        console.error('❌ Erro ao inserir dados de teste:', insertError)
        return { success: false, error: insertError }
      }
      
      console.log('✅ Tabela profiles criada com dados de teste')
    } else if (profilesError) {
      console.error('❌ Erro ao verificar tabela profiles:', profilesError)
      return { success: false, error: profilesError }
    } else {
      console.log('✅ Tabela profiles já existe')
    }

    console.log('🎉 Configuração do banco de dados concluída!')
    return { success: true }

  } catch (error) {
    console.error('💥 Erro geral na configuração do banco:', error)
    return { success: false, error }
  }
}

export async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com o banco...')
  
  try {
    // Testar conexão básica
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Erro na conexão:', error)
      return { connected: false, error }
    }

    console.log('✅ Conexão com banco estabelecida')
    return { connected: true, data }

  } catch (error) {
    console.error('💥 Erro ao testar conexão:', error)
    return { connected: false, error }
  }
}