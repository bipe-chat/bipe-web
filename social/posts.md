# Social posts

Posts for Instagram only (bipe-chat/bipe#465). The store carousel posts come from the `## Screenshots`
table in bipe-shared/product/appstore.md; this file holds the posts that are not in the store. Same
columns and same parser (bipe-shared tools/lib/appstore.mjs), plus `capture`: the store capture a
post reuses, when its slug is not a capture slug. Render with:

    pnpm store:images --device ig-post --locale pt-BR --listing social/posts.md

Copy rules: Bipe voice writes "para", no dashes, the lead message is that the data stays in Brazil.

## Screenshots

### pt-BR

| slug | feature | layout | capture | headline | sub | badge | callout |
|---|---|---|---|---|---|---|---|
| mensagens-no-brasil | - | text |  | Mensagens com os dados *no Brasil* | O Bipe guarda suas conversas em servidores daqui | Bipe |  |
| nao-sai-do-brasil | - | text |  | Sua conversa *não sai do Brasil* | Servidores no Brasil, de empresas brasileiras | Dados no Brasil |  |
| pix-antes | pix-check | phone | conferir-pix | Recebeu um código Pix? *Confira antes* | O Bipe mostra o nome e o valor que estão no código | Conferir Pix | Nome e valor do código |
| numero-estranho | requests | phone | pedidos | Número que você não conhece *vira pedido* | Ele só entra na conversa se você aceitar | Pedidos de conversa | Você vê antes de aceitar |
