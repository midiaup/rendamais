// frontend/next.config.mjs

import createNextIntlPlugin from 'next-intl/plugin';

// ATUALIZAÇÃO: Passamos o caminho para o nosso ficheiro de configuração aqui
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig = {
  devIndicators: {
    allowedDevOrigins: [
      'http://localhost:3000',
      'http://192.168.56.1:3000',
    ],
  },
};

export default withNextIntl(nextConfig);