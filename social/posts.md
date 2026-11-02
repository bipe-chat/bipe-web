# Social posts

Posts for Instagram only (bipe-chat/bipe#465). The store carousel posts come from the `## Screenshots`
table in bipe-shared/product/appstore.md; this file holds the posts that are not in the store. Same
columns and same parser (bipe-shared tools/lib/appstore.mjs): `title` and `sub`, plus `layout`
(phone, map, type, bubble), `capture` (the store capture a phone post reuses, when its slug is not a
capture slug), and `from` and `bubble` (the sender and the text of a bubble post). Layouts, copy
limits and the variety rules are in social/guide.md. Render with:

    pnpm store:images --device ig-post --locale pt-BR --listing social/posts.md

Copy rules (social/guide.md): Bipe voice writes "para", bubbles keep "pra", no dashes, the lead message is that the data stays in Brazil.


## Screenshots

### pt-BR

| slug | feature | layout | capture | from | bubble | title | sub |
|---|---|---|---|---|---|---|---|
| mensagens-no-brasil | - | map |  |  |  | Mensagens com os dados no Brasil | O Bipe guarda suas conversas em servidores daqui |
| numero-estranho | requests | bubble |  | Pedido de conversa | Oi! Vi seu anúncio, ainda tá disponível? | Número que você não conhece vira pedido | Ele só entra na conversa se você aceitar |
| pix-antes | pix-check | phone | conferir-pix |  |  | Recebeu um código Pix? Confira antes | O Bipe mostra o nome e o valor que estão no código |
| nao-sai-do-brasil | brazil-servers | type |  |  |  | Sua conversa não sai do Brasil | Servidores no Brasil, de empresas brasileiras |
| empresa-no-app | agenda | phone | empresa |  |  | Sua empresa no mesmo app | Com agenda, catálogo e fila |
| seu-arroba | handles | bubble |  | Joana Lima | Me chama no Bipe: @joana.lima | Passe seu @, não seu número | O link abre a conversa com você |
| sem-anuncio | no-ads | type |  |  |  | Aqui não tem anúncio nem venda de dados | Sua conversa não vira propaganda |
| cara-de-golpe | scam-alerts | phone | aviso-golpe |  |  | Mensagem com cara de golpe? | O Bipe avisa antes de você agir |
| codigo-aberto | open-source | type |  |  |  | Código aberto | Qualquer pessoa pode ler como o Bipe funciona |
