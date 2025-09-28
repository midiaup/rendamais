// frontend/src/i18n.ts

import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  // Aguarda o locale da requisição
  const locale = await requestLocale;
  
  // Validação do locale para evitar undefined - usa 'pt' como fallback
  const validLocale = locale && ['pt', 'en', 'es'].includes(locale) ? locale : 'pt';
  
  try {
    // CORREÇÃO: O caminho agora aponta para a pasta messages no mesmo nível (dentro de src)
    const messages = (await import(`./messages/${validLocale}.json`)).default;
    return { 
      messages,
      locale: validLocale // Retornando o locale validado
    };
  } catch (error) {
    console.error(`Erro ao carregar mensagens para locale ${validLocale}:`, error);
    // Fallback para português se houver erro
    const fallbackMessages = (await import(`./messages/pt.json`)).default;
    return {
      messages: fallbackMessages,
      locale: 'pt'
    };
  }
});