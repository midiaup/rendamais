import { supabase } from './supabaseClient';

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Teste básico de conexão
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return { success: false, error };
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    
    // Verificar tabelas existentes
    const tables = ['profiles', 'wallets', 'matrices', 'donations', 'donation_events', 'notifications'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        tableStatus[table] = error ? 'Erro' : 'OK';
        if (error) {
          console.warn(`⚠️ Tabela ${table}:`, error.message);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        tableStatus[table] = 'Erro';
        console.warn(`⚠️ Tabela ${table}:`, err);
      }
    }
    
    return { 
      success: true, 
      tableStatus,
      message: 'Conexão estabelecida com sucesso'
    };
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
    return { success: false, error: err };
  }
}

export async function checkDatabaseSchema() {
  try {
    console.log('🔍 Verificando schema do banco...');
    
    // Verificar se as funções existem
    const functions = [
      'get_user_dashboard_stats',
      'get_recent_donations',
      'get_next_donation_target'
    ];
    
    const functionStatus = {};
    
    for (const func of functions) {
      try {
        // Tentar executar a função com parâmetros de teste
        if (func === 'get_user_dashboard_stats') {
          const { data, error } = await supabase.rpc(func, { p_user_id: '00000000-0000-0000-0000-000000000000' });
          functionStatus[func] = error ? 'Erro' : 'OK';
        } else if (func === 'get_recent_donations') {
          const { data, error } = await supabase.rpc(func, { limit_count: 1 });
          functionStatus[func] = error ? 'Erro' : 'OK';
        } else if (func === 'get_next_donation_target') {
          const { data, error } = await supabase.rpc(func, { p_user_id: '00000000-0000-0000-0000-000000000000' });
          functionStatus[func] = error ? 'Erro' : 'OK';
        }
        
        if (functionStatus[func] === 'OK') {
          console.log(`✅ Função ${func}: OK`);
        } else {
          console.warn(`⚠️ Função ${func}: Não encontrada ou com erro`);
        }
      } catch (err) {
        functionStatus[func] = 'Erro';
        console.warn(`⚠️ Função ${func}:`, err);
      }
    }
    
    return {
      success: true,
      functionStatus,
      message: 'Verificação do schema concluída'
    };
    
  } catch (err) {
    console.error('❌ Erro ao verificar schema:', err);
    return { success: false, error: err };
  }
}