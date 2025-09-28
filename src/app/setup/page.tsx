'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setIsLoading(true)
    addLog('🔍 Testando conexão com Supabase...')
    
    try {
      const response = await fetch('/api/setup', { method: 'GET' })
      const result = await response.json()
      
      if (result.connected) {
        addLog('✅ Conexão estabelecida com sucesso!')
        setConnectionStatus('connected')
      } else {
        addLog(`❌ Falha na conexão: ${result.error}`)
        if (result.needsSetup) {
          addLog('📝 Banco precisa ser configurado')
        }
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      addLog(`💥 Erro ao testar conexão: ${error}`)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const setupDatabase = async () => {
    setIsLoading(true)
    addLog('🔧 Iniciando configuração do banco de dados...')
    
    try {
      const response = await fetch('/api/setup', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        addLog(`✅ ${result.message}`)
        addLog(`📋 Ação realizada: ${result.action}`)
        setConnectionStatus('connected')
      } else {
        addLog(`❌ Erro na configuração: ${result.error}`)
        if (result.details) {
          addLog(`🔍 Detalhes: ${JSON.stringify(result.details, null, 2)}`)
        }
      }
    } catch (error) {
      addLog(`💥 Erro ao configurar banco: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const applySchema = async () => {
    setIsLoading(true)
    addLog('📋 Aplicando schema SQL completo...')
    
    try {
      const response = await fetch('/api/setup/apply-schema', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        addLog(`✅ ${result.message}`)
        addLog(`📊 Resumo: ${result.summary.success} sucessos, ${result.summary.errors} erros`)
        
        if (result.results) {
          result.results.forEach((r: any, index: number) => {
            if (r.success) {
              addLog(`  ✅ Comando ${r.command}: OK`)
            } else {
              addLog(`  ❌ Comando ${r.command}: ${r.error}`)
            }
          })
        }
        
        setConnectionStatus('connected')
      } else {
        addLog(`❌ Erro na aplicação do schema: ${result.error}`)
        if (result.results) {
          addLog(`📊 Resumo: ${result.summary?.success || 0} sucessos, ${result.summary?.errors || 0} erros`)
        }
      }
    } catch (error) {
      addLog(`💥 Erro ao aplicar schema: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkSchema = async () => {
    setIsLoading(true)
    addLog('🔍 Verificando status do schema...')
    
    try {
      const response = await fetch('/api/setup/apply-schema', { method: 'GET' })
      const result = await response.json()
      
      if (result.applied) {
        addLog('✅ Schema completamente aplicado')
        addLog(`📋 Tabelas existentes: ${result.existingTables.join(', ')}`)
        setConnectionStatus('connected')
      } else {
        addLog(`⚠️ ${result.message}`)
        if (result.missingTables?.length > 0) {
          addLog(`❌ Tabelas faltando: ${result.missingTables.join(', ')}`)
        }
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      addLog(`💥 Erro ao verificar schema: ${error}`)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFunctions = async () => {
    setIsLoading(true)
    addLog('🔧 Aplicando funções SQL...')
    
    try {
      const response = await fetch('/api/setup/apply-functions', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        addLog(`✅ ${result.message}`)
        addLog(`📊 Resumo: ${result.summary.success} sucessos, ${result.summary.errors} erros`)
        
        if (result.results) {
          result.results.forEach((r: any) => {
            if (r.success) {
              addLog(`  ✅ Função ${r.function}: OK`)
            } else {
              addLog(`  ❌ Função ${r.function}: ${r.error}`)
            }
          })
        }
      } else {
        addLog(`❌ Erro na aplicação das funções: ${result.error}`)
        if (result.results) {
          addLog(`📊 Resumo: ${result.summary?.success || 0} sucessos, ${result.summary?.errors || 0} erros`)
        }
      }
    } catch (error) {
      addLog(`💥 Erro ao aplicar funções: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkFunctions = async () => {
    setIsLoading(true)
    addLog('🔍 Verificando status das funções...')
    
    try {
      const response = await fetch('/api/setup/apply-functions', { method: 'GET' })
      const result = await response.json()
      
      if (result.applied) {
        addLog('✅ Todas as funções estão aplicadas')
        addLog(`📋 Funções existentes: ${result.existingFunctions.join(', ')}`)
      } else {
        addLog(`⚠️ ${result.message}`)
        if (result.missingFunctions?.length > 0) {
          addLog(`❌ Funções faltando: ${result.missingFunctions.join(', ')}`)
        }
      }
    } catch (error) {
      addLog(`💥 Erro ao verificar funções: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFunctions = async () => {
    setIsLoading(true)
    addLog('🧪 Testando funções SQL existentes...')
    
    try {
      const response = await fetch('/api/setup/test-functions', { method: 'POST' })
      const result = await response.json()
      
      addLog(`📊 ${result.message}`)
      
      if (result.functions) {
        addLog('🔧 Resultados das funções:')
        result.functions.forEach((f: any) => {
          if (f.success) {
            addLog(`  ✅ ${f.function}: OK ${f.count !== undefined ? `(${f.count} registros)` : ''}`)
          } else {
            addLog(`  ❌ ${f.function}: ${f.error} ${f.code ? `(${f.code})` : ''}`)
          }
        })
      }
      
      if (result.tables) {
        addLog('📋 Resultados das tabelas:')
        result.tables.forEach((t: any) => {
          if (t.success) {
            addLog(`  ✅ ${t.table}: OK`)
          } else {
            addLog(`  ❌ ${t.table}: ${t.error}`)
          }
        })
      }
      
      if (result.success) {
        setConnectionStatus('connected')
      }
    } catch (error) {
      addLog(`💥 Erro ao testar funções: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const applyDashboardFunctions = async () => {
    setIsLoading(true)
    addLog('🚀 Aplicando funções do dashboard...')
    
    try {
      const response = await fetch('/api/setup/apply-dashboard-functions', { method: 'POST' })
      const result = await response.json()
      
      addLog(`📊 ${result.message}`)
      
      if (result.results) {
        result.results.forEach((r: any) => {
          if (r.success) {
            addLog(`  ✅ Função ${r.function}: Aplicada com sucesso`)
          } else {
            addLog(`  ❌ Função ${r.function}: ${r.error}`)
          }
        })
      }
      
      if (result.success) {
        addLog('🎉 Todas as funções do dashboard foram aplicadas!')
      }
    } catch (error) {
      addLog(`💥 Erro ao aplicar funções do dashboard: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkDashboardFunctions = async () => {
    setIsLoading(true)
    addLog('🔍 Verificando funções do dashboard...')
    
    try {
      const response = await fetch('/api/setup/apply-dashboard-functions')
      const result = await response.json()
      
      addLog(`📋 ${result.message}`)
      
      if (result.existingFunctions?.length > 0) {
        addLog(`✅ Funções existentes: ${result.existingFunctions.join(', ')}`)
      }
      
      if (result.missingFunctions?.length > 0) {
        addLog(`❌ Funções faltantes: ${result.missingFunctions.join(', ')}`)
      }
    } catch (error) {
      addLog(`💥 Erro ao verificar funções do dashboard: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkMissingFunction = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/setup/create-function-direct')
      const data = await response.json()
      
      if (data.exists && data.working) {
        addLog('✅ Função get_recent_donations está funcionando corretamente', 'success')
        if (data.sampleData) {
          addLog(`📊 Dados de exemplo: ${JSON.stringify(data.sampleData)}`, 'info')
        }
      } else if (data.exists && !data.working) {
        addLog('⚠️ Função get_recent_donations existe mas tem problemas', 'warning')
        addLog(`❌ Erro: ${data.error}`, 'error')
      } else {
        addLog('❌ Função get_recent_donations não encontrada', 'error')
        addLog('💡 Execute manualmente o SQL no painel do Supabase:', 'info')
        addLog('📁 Arquivo: create_missing_function.sql', 'info')
      }
    } catch (error) {
      addLog(`❌ Erro ao verificar função: ${error}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const applyMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/setup/apply-migration', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        addLog('✅ Migration aplicada com sucesso!', 'success')
        addLog(`📊 Resultado: ${data.message}`, 'success')
      } else {
        addLog('❌ Falha na aplicação da migration', 'error')
        addLog(`📝 Detalhes: ${data.message}`, 'error')
        
        if (data.results) {
          data.results.forEach((result: any, index: number) => {
            if (result.success) {
              addLog(`✅ Comando ${result.command}: Sucesso (${result.method})`, 'success')
            } else {
              addLog(`❌ Comando ${result.command}: ${result.error}`, 'error')
            }
          })
        }
        
        addLog('💡 Tente executar manualmente no painel do Supabase:', 'info')
        addLog('📁 Arquivo: create_missing_function.sql', 'info')
      }
    } catch (error) {
      addLog(`❌ Erro ao aplicar migration: ${error}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Configuração do Banco de Dados
          </h1>
          
          {/* Status da Conexão */}
          <div className="mb-6 p-4 rounded-lg border">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="font-medium">
                Status: {
                  connectionStatus === 'connected' ? 'Conectado' :
                  connectionStatus === 'disconnected' ? 'Desconectado' : 'Verificando...'
                }
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button
              onClick={testConnection}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testando...' : 'Testar Conexão'}
            </button>
            
            <button
              onClick={setupDatabase}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Configurando...' : 'Configurar BD'}
            </button>
            
            <button
              onClick={checkSchema}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar Schema'}
            </button>
            
            <button
              onClick={applySchema}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Aplicando...' : 'Aplicar Schema'}
            </button>
            
            <button
              onClick={checkFunctions}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar Funções'}
            </button>
            
            <button
              onClick={applyFunctions}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Aplicando...' : 'Aplicar Funções'}
            </button>
            
            <button
              onClick={checkDashboardFunctions}
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar Dashboard'}
            </button>
            
            <button
              onClick={applyDashboardFunctions}
              disabled={isLoading}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Aplicando...' : 'Aplicar Dashboard'}
            </button>
            
            <button
              onClick={checkMissingFunction}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar Função'}
            </button>
            
            <button
              onClick={applyMigration}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Aplicando...' : 'Aplicar Migration'}
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Logs de Execução</h2>
              <div className="flex space-x-2">
                <button
                  onClick={testFunctions}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Testando...' : 'Testar Funções'}
                </button>
                <button
                  onClick={clearLogs}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Limpar Logs
                </button>
              </div>
            </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-gray-400">📋 Logs do Sistema:</div>
            {logs.length === 0 ? (
              <div className="text-gray-500">Nenhum log ainda. Clique em "Testar Conexão" para começar.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}