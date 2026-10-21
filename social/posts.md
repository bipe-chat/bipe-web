# Social posts

Posts for Instagram only (bipe-chat/bipe#465). The store carousel posts come from the `## Screenshots`
table in bipe-shared/product/appstore.md; this file holds the posts that are not in the store. Same
columns and same parser (bipe-shared tools/lib/appstore.mjs): `title` and `sub`, plus `capture`: the
store capture a post reuses, when its slug is not a capture slug. A post with feature `-` is text
only: the title and the sub over the backdrop. Render with:

    pnpm store:images --device ig-post --locale pt-BR --listing social/posts.md

Copy rules: Bipe voice writes "para", no dashes, the lead message is that the data stays in Brazil.

## Screenshots

### pt-BR

| slug | feature | capture | title | sub |
|---|---|---|---|---|
| mensagens-no-brasil | - |  | Mensagens com os dados no Brasil | O Bipe guarda suas conversas em servidores daqui |
| nao-sai-do-brasil | - |  | Sua conversa não sai do Brasil | Servidores no Brasil, de empresas brasileiras |
| pix-antes | pix-check | conferir-pix | Recebeu um código Pix? Confira antes | O Bipe mostra o nome e o valor que estão no código |
| numero-estranho | requests | pedidos | Número que você não conhece vira pedido | Ele só entra na conversa se você aceitar |
