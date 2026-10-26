# Arquitetura

O Bipe roda sobre o protocolo aberto Matrix, com apps nativos e servidores no Brasil. Esta página mostra cada parte e o que ela faz.

_Atualizado em 13 de outubro de 2026._

## Visão geral

| Camada | Partes |
|---|---|
| Apps | iPhone (SwiftUI) e Android (Kotlin, Jetpack Compose), feitos a partir do Element X. Núcleo em Rust: matrix-rust-sdk |
| No aparelho | Criptografia de ponta a ponta, aviso de golpe, checagem de nome |
| Servidores | Synapse, Matrix Authentication Service, API do Bipe, Sygnal, LiveKit, Postgres, Caddy |
| Site | Páginas estáticas no `bipe.chat`, cada uma também em Markdown |

## Matrix, com federação fechada

Matrix é um protocolo aberto de mensagens. O Bipe roda o próprio servidor Matrix, o Synapse, com o nome de servidor `bipe.net.br`.

A federação é fechada. O servidor do Bipe não troca mensagens com outros servidores Matrix, e outros servidores não chegam aos usuários do Bipe. Assim, quem fala com alguém no Bipe está no Bipe, onde valem as regras de identidade.

## Contas e IDs

O Bipe tem três camadas de nome:

- **ID do Matrix.** Fixo e aleatório, por exemplo `@a1b2c3d4e5f6:bipe.net.br`. Não vem do nome nem do número de telefone.
- **@ (nome de usuário).** Opcional e pode mudar. Fica na API do Bipe. De 2 a 30 caracteres: letras minúsculas, números, ponto e sublinhado. Depois de uma troca, a próxima só vale 30 dias depois, e ninguém pega o @ antigo por 90 dias.
- **Nome de exibição.** Texto livre. O nome verificado, quando existe, vem da verificação, não da pessoa.

Não existe busca de @ nem lista de usuários. A consulta de um @ é exata e pede uma conta com login.

O número de telefone fica escondido. Cada pessoa escolhe quem pode achar ela pelo número: todo mundo, só os contatos ou ninguém. O padrão é só os contatos.

## Login e recuperação

O Matrix Authentication Service (MAS) cuida do login em `account.bipe.net.br`. Não existe código por SMS.

A conta fica no celular. A pessoa escolhe uma senha de 8 números. Um celular novo volta para a conta com o código de recuperação e a senha, ou com um link por e-mail e a senha. A recuperação por e-mail espera um prazo, e o celular antigo pode cancelar.

## Criptografia e checagens no aparelho

As conversas privadas são cifradas de ponta a ponta no aparelho. O servidor entrega as mensagens. Ele não consegue ler.

O aviso de golpe roda no celular, depois de decifrar. A mensagem não sai do aparelho para a checagem. A checagem de nome também: nomes reservados (bancos, órgãos públicos, o Bipe) e letras disfarçadas (`0` no lugar de `O`, letras de outros alfabetos).

## Servidores

| Parte | Função |
|---|---|
| Synapse | Servidor Matrix: salas, mensagens, sincronização |
| Matrix Authentication Service | Login, sessões, tokens (OIDC) |
| API do Bipe | Cadastro com convite, @, achar contatos, recuperação, perfil público, checagem de CNPJ, selos |
| Sygnal | Envia notificações pelos serviços da Apple e do Google |
| LiveKit | Chamadas de voz e vídeo (MatrixRTC) e o TURN em `turn.bipe.net.br` |
| Element Web | App na web, em `chat.bipe.net.br` |
| Postgres | Bancos de dados do Synapse, do MAS e da API do Bipe |
| Caddy | TLS e roteamento de todos os endereços |

A API do Bipe é escrita em TypeScript, sobre Postgres. Ela confere o token de acesso Matrix de cada pedido com o MAS. O Synapse chama a API por um caminho interno, que não é público.

## Regras compartilhadas

Um repositório guarda o que os apps e o site têm em comum: nomes reservados, padrões de golpe, textos dos apps, o contrato da API e os casos de teste. Uma etapa de build gera Swift, Kotlin e TypeScript a partir dele. Os dois apps rodam os mesmos casos de teste, então uma regra dá o mesmo resultado no iPhone, no Android e no site.

## Hospedagem

Os servidores ficam no Brasil, em empresas brasileiras. As conversas e as contas ficam guardadas lá. O servidor de chamadas e o TURN também ficam no Brasil. Nenhuma chamada passa por um serviço fora do Brasil.

## Site

O `bipe.chat` é HTML estático, gerado com React e Vite antes de ir para o ar. Não tem rastreador de terceiros. Toda página tem uma versão em Markdown em `index.md`, e o [/llms.txt](/llms.txt) lista todas.

## Código do Bipe

O código é aberto, com licença AGPL-3.0, em [github.com/bipe-chat](https://github.com/bipe-chat).

- [bipe-ios](https://github.com/bipe-chat/bipe-ios) e [bipe-android](https://github.com/bipe-chat/bipe-android): os apps
- [bipe-shared](https://github.com/bipe-chat/bipe-shared): regras, textos dos apps, [contrato da API](https://github.com/bipe-chat/bipe-shared/blob/main/api/openapi.yaml) e casos de teste
- [bipe-api](https://github.com/bipe-chat/bipe-api): a API do Bipe
- [bipe-web](https://github.com/bipe-chat/bipe-web): este site
- [bipe-ml](https://github.com/bipe-chat/bipe-ml): o modelo de golpes que roda no celular
- [bipe-business](https://github.com/bipe-chat/bipe-business): ponte e caixa de entrada para empresas
- [compound-design-tokens](https://github.com/bipe-chat/compound-design-tokens): cores e estilos

## Projetos de origem

- [Element X iOS](https://github.com/element-hq/element-x-ios) e [Element X Android](https://github.com/element-hq/element-x-android)
- [matrix-rust-sdk](https://github.com/matrix-org/matrix-rust-sdk)
- [Synapse](https://github.com/element-hq/synapse)
- [Matrix Authentication Service](https://github.com/element-hq/matrix-authentication-service)
- [Sygnal](https://github.com/matrix-org/sygnal)
- [LiveKit](https://github.com/livekit/livekit)
- [Compound design tokens](https://github.com/element-hq/compound-design-tokens)
