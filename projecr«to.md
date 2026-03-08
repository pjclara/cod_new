Já tenho um projeto Laravel 12 com React a funcionar corretamente (instalado via Breeze).  
Quero agora que me ajudes a estruturar e desenvolver o resto da aplicação.

### Objetivo da aplicação
Criar uma web app para consulta de ICD‑10‑CM (diagnósticos) e ICD‑10‑PCS (procedimentos), organizada por:
- Especialidade
- Subespecialidade
- Código e descrição

### O que preciso que faças
1. Define a arquitetura completa da API em Laravel 12 (sem reinstalar nada).
2. Cria as migrations MySQL para:
   - specialties
   - subspecialties
   - icd10_cm
   - icd10_pcs
   - favorites
3. Cria os Models e relacionamentos Eloquent.
4. Cria os Controllers API (REST) com os métodos:
   - index
   - show
   - search
   - store (para favoritos)
5. Cria as rotas API no `routes/api.php`.
6. Cria seeders para importar ICD‑10‑CM e ICD‑10‑PCS (podes usar exemplos ou placeholders).
7. Cria a estrutura das páginas React:
   - Lista de especialidades
   - Lista de subespecialidades
   - Lista de códigos
   - Página de detalhes
   - Favoritos
8. Cria exemplos de chamadas API com Axios.
9. Define o fluxo de navegação (UX) entre as páginas.
10. Cria um roadmap de desenvolvimento baseado no que já está feito.

### Regras
- Não explicar como instalar Laravel, React ou Breeze (já está tudo instalado).
- Foca-te apenas na arquitetura, código, tabelas, rotas e frontend.
- Usa exemplos reais de código Laravel e React.
- Mantém tudo organizado e modular.

### Resultado esperado
Um guia técnico completo para continuar o desenvolvimento da aplicação, com código pronto para copiar e colar.
