import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Adicione todos os idiomas que você suporta
  locales: ['pt', 'en', 'es'],

  // Usado se o idioma na URL não for encontrado
  defaultLocale: 'pt',
  
  // Usar 'always' para forçar o prefixo em todas as rotas
  localePrefix: 'always'
});

export const config = {
  // Aplica o middleware a todas as rotas
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|setup).*)'
  ]
};
