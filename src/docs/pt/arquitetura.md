# Arquitetura

O Bipe roda sobre o protocolo aberto Matrix, com apps nativos e servidores no Brasil. Esta página mostra cada parte e o que ela faz.

## Visão geral

| Camada | Partes |
|---|---|
| Apps | iPhone (SwiftUI) e Android (Kotlin, Jetpack Compose), um app só do Bipe. Núcleo em Rust: matrix-rust-sdk |
| No aparelho | Criptografia de ponta a ponta, aviso de golpe, checagem de nome, transcrição de áudio |
| Servidores | Synapse, Matrix Authentication Service, API do Bipe, Sygnal, LiveKit, servidor de mapas, Postgres, Caddy |
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

Ninguém vê o número de outra pessoa pelo Bipe. O app mostra para você o seu próprio número vinculado. O número de outra pessoa só aparece quando ele já está na sua agenda. Cada pessoa escolhe quem pode achar ela pelo número: todo mundo, só os contatos ou ninguém. O padrão é só os contatos.

## Login e recuperação

O Matrix Authentication Service (MAS) cuida do login em `account.bipe.net.br`. Não existe código por SMS.

A conta fica no celular. A pessoa escolhe uma senha de 8 números. Um celular novo volta para a conta de um destes jeitos:

- Com o QR code que outro aparelho, onde a conta já está, mostra na tela.
- Com o código de recuperação e a senha.
- Com um link por e-mail e a senha.
- Com uma conta Apple ou Google vinculada e a senha. A conta vinculada não troca a senha.

A volta por e-mail e a volta pela conta Apple ou Google esperam 24 horas, e o celular antigo pode cancelar.

No computador, a conta só entra por QR code. O navegador mostra o código, e o celular com a conta lê e aprova. Na web não tem senha.

## Criptografia e checagens no aparelho

As conversas privadas são protegidas de ponta a ponta no aparelho. O servidor entrega as mensagens. Ele não consegue ler.

Chamadas de voz e vídeo também têm criptografia de ponta a ponta. Cada aparelho manda a chave só para quem está na chamada. O servidor de chamadas, no Brasil, repassa a mídia sem conseguir abrir.

O aviso de golpe roda no celular, depois de decifrar. A mensagem não sai do aparelho para a checagem. A checagem de nome também: nomes reservados (bancos, órgãos públicos, o Bipe) e letras disfarçadas (`0` no lugar de `O`, letras de outros alfabetos).

A transcrição de mensagens de voz também roda no celular. Quem manda transcreve o áudio no próprio celular antes de enviar. Quem recebe pode transcrever no próprio celular. O áudio não sai do aparelho para a transcrição.

## Servidores

| Parte | Função |
|---|---|
| Synapse | Servidor Matrix: salas, mensagens, sincronização |
| Matrix Authentication Service | Login, sessões, tokens (OIDC) |
| API do Bipe | Cadastro com convite, checagem do aparelho no cadastro, @, achar contatos, recuperação, aprovação de um computador por QR code, perfil público, checagem de CNPJ, selos, marcas de revenda, guardiões e celular roubado, catálogo, agenda, fila, pedidos e orçamentos das empresas, apagar a conta, baixar os dados, relatos de problema e conversa com o suporte |
| Sygnal | Envia notificações pelo serviço da Apple no iPhone e pelo do Google (Firebase) no Android. A versão de Android sem os serviços do Google não recebe notificações |
| LiveKit | Chamadas de voz e vídeo (MatrixRTC), o serviço de tokens que libera a entrada de cada pessoa na chamada, e o TURN em `turn.bipe.net.br` |
| Servidor de mapas | Mapas das localizações compartilhadas em `maps.bipe.net.br`, com dados do OpenStreetMap (© OpenStreetMap) |
| Element Web | App na web, em `chat.bipe.net.br`. Entra só por QR code lido no celular |
| Postgres | Bancos de dados do Synapse, do MAS e da API do Bipe |
| Caddy | TLS e roteamento de todos os endereços |

A API do Bipe é escrita em TypeScript, sobre Postgres. Ela confere o token de acesso Matrix de cada pedido com o MAS. O Synapse chama a API por um caminho interno, que não é público.

## Regras compartilhadas

Um repositório guarda o que os apps e o site têm em comum: nomes reservados, padrões de golpe, textos dos apps, o contrato da API e os casos de teste. Uma etapa de build gera Swift, Kotlin e TypeScript a partir dele. Os dois apps rodam os mesmos casos de teste, então uma regra dá o mesmo resultado no iPhone, no Android e no site.

## Hospedagem

Os servidores ficam no Brasil, em empresas brasileiras. As conversas e as contas ficam guardadas lá. O servidor de chamadas e o TURN também ficam no Brasil. Nenhuma chamada passa por um serviço fora do Brasil. Os mapas também vêm dos servidores no Brasil.

## Site

O `bipe.chat` é HTML estático, gerado com React e Vite antes de ir para o ar. Não tem rastreador de terceiros. Toda página tem uma versão em Markdown em `index.md`, e o [/llms.txt](/llms.txt) lista todas.

Os formulários de ajuda e de organizações vão para o sistema de trabalho da equipe, na União Europeia.

## Código do Bipe

O código é aberto, com licença AGPL-3.0, em [github.com/bipe-chat](https://github.com/bipe-chat).

{{repos}}

O contrato da API está em [openapi.yaml](https://github.com/bipe-chat/bipe-shared/blob/main/api/openapi.yaml).

## Projetos de origem

- [matrix-rust-sdk](https://github.com/matrix-org/matrix-rust-sdk)
- [Synapse](https://github.com/element-hq/synapse)
- [Matrix Authentication Service](https://github.com/element-hq/matrix-authentication-service)
- [Sygnal](https://github.com/matrix-org/sygnal)
- [LiveKit](https://github.com/livekit/livekit)
- [Element Web](https://github.com/element-hq/element-web)
