# Pending Quality Tasks

## Corrigir erro ortográfico
- **Problema:** O texto em inglês do dashboard exibe "{level}º Level" com o ordinal português "º", o que é percebido como erro tipográfico para falantes de inglês.
- **Localização:** `src/messages/en.json`, chave `Dashboard.level`.
- **Tarefa proposta:** Atualizar a string para usar a terminação ordinal em inglês (por exemplo, `{level}th Level`) ou aplicar lógica que escolha o sufixo correto.

## Corrigir um erro funcional
- **Problema:** Após o login ou ao navegar pelo menu lateral, o usuário é redirecionado para rotas sem o prefixo de locale (por exemplo, `/dashboard`), o que quebra a navegação localizada e força o fallback para português.
- **Localização:** `src/app/[locale]/login/page.tsx` (linha de `router.push('/dashboard')`) e links fixos no `Sidebar` e em outras páginas (por exemplo, `src/app/[locale]/register/page.tsx` usa `Link href="/login"`).
- **Tarefa proposta:** Utilizar o roteador internacionalizado de `@/lib/navigation` ou interpolar o locale atual nas URLs antes de redirecionar/linkar.

## Corrigir documentação/comentário impreciso
- **Problema:** O README informa que a página principal pode ser editada em `app/page.tsx`, mas esse arquivo apenas redireciona para `/pt`; o conteúdo real vive em `app/[locale]/*`.
- **Localização:** `README.md`, seção "Getting Started".
- **Tarefa proposta:** Atualizar a documentação explicando a estrutura multi-idioma e apontando para os arquivos reais (`app/[locale]/...`).

## Melhorar um teste
- **Problema:** Não há cobertura automatizada para a lógica de agrupamento/ordenação da matriz no componente `MatrixView`, deixando o comportamento crítico sem garantia.
- **Localização:** `src/components/Dashboard/MatrixView.tsx`, laços que agrupam por nível e ordenam por `position`.
- **Tarefa proposta:** Adicionar um teste com React Testing Library que monte o componente com participantes fora de ordem, verifique a renderização agrupada e o fallback "DOE" quando a lista estiver vazia.
