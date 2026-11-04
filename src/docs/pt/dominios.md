# Domínios

Os dados ficam no Brasil, e o endereço do serviço também. O Bipe usa dois domínios, cada um com uma função: o `bipe.net.br` roda o serviço, o `bipe.chat` leva os links que as pessoas compartilham.

## Os dois domínios

| Domínio | Registro | Função |
|---|---|---|
| `bipe.net.br` | NIC.br, no Brasil | Nome do servidor Matrix e todos os endereços do serviço |
| `bipe.chat` | Registro do `.chat`, fora do Brasil | Site e links compartilhados |

## Por que o nome do servidor fica no .br

O nome do servidor Matrix faz parte de todo ID de usuário e de todo ID de sala. Exemplo: `@a1b2c3d4e5f6:bipe.net.br`. Ele não muda sem criar contas novas para todo mundo. Por isso ele precisa ficar onde nenhuma empresa ou governo de fora consegue desligar.

O NIC.br administra o `.br` no Brasil. Um domínio `.chat` depende de um registro e de um registrador fora do Brasil. O Bipe coloca no `.br` a parte que não pode mudar, e no `bipe.chat` a parte que pode mudar de lugar.

Se o `bipe.chat` parar, as conversas continuam. Só o site e as prévias de link novas param.

## Endereços no bipe.net.br

| Endereço | Serviço | Quem usa |
|---|---|---|
| `bipe.net.br` | Descoberta Matrix: só `/.well-known/matrix/client`. O resto é 404 | Os apps, no login |
| `matrix.bipe.net.br` | Servidor Matrix (Synapse) | Os apps |
| `account.bipe.net.br` | Login e contas (Matrix Authentication Service) | Os apps |
| `api.bipe.net.br` | API do Bipe: cadastro, convites, @, recuperação, verificação | Os apps e o site |
| `push.bipe.net.br` | Notificações (Sygnal). Só `/_matrix/push/*` | O servidor Matrix |
| `rtc.bipe.net.br` | Chamadas de voz e vídeo (LiveKit) | Os apps e o navegador |
| `turn.bipe.net.br` | Retransmissão das chamadas (TURN do LiveKit), para redes que bloqueiam o tráfego direto | Os apps e o navegador |
| `maps.bipe.net.br` | Mapas das localizações compartilhadas, com dados do OpenStreetMap (© OpenStreetMap), servidos dos servidores do Bipe no Brasil | Os apps |
| `chat.bipe.net.br` | App na web (Element Web) | Navegadores |
| `admin.bipe.net.br` | Painel da equipe | Só a equipe do Bipe |

## O que fica no bipe.chat

- O site, em português em `/` e em inglês em `/en/`.
- Links de perfil: `bipe.chat/@arroba`.
- Links de convite: `bipe.chat/convite/<código>`.
- Links de e-mail para recuperar a conta e confirmar o e-mail.
- O servidor MCP público para assistentes de IA: `mcp.bipe.chat/mcp`. Só dados públicos.
- Termos e privacidade.
- Os arquivos que deixam os apps abrirem esses links: `/.well-known/apple-app-site-association` (iPhone) e `/.well-known/assetlinks.json` (Android).
- O endereço de cliente OAuth dos apps. O serviço de login confere se o esquema de retorno do app é este endereço ao contrário. Por isso o ID do app é `chat.bipe.app`.

## Confira você mesmo

Descoberta Matrix no nome do servidor:

```
curl https://bipe.net.br/.well-known/matrix/client
```

A resposta aponta o servidor Matrix, o serviço de login e o serviço de chamadas:

```
{
  "m.homeserver": { "base_url": "https://matrix.bipe.net.br" },
  "org.matrix.msc2965.authentication": {
    "issuer": "https://account.bipe.net.br/",
    "account": "https://account.bipe.net.br/account"
  },
  "org.matrix.msc4143.rtc_foci": [
    { "type": "livekit", "livekit_service_url": "https://rtc.bipe.net.br" }
  ]
}
```

Não existe `/.well-known/matrix/server`. A federação é fechada, então outros servidores Matrix não procuram o Bipe.

## Regras para links e IDs

- As pessoas só veem e compartilham endereços `bipe.chat`.
- Os apps e o código só falam com endereços `bipe.net.br`.
- O nome do servidor é `bipe.net.br`. Ele não muda.
- Os certificados vêm do Let's Encrypt.
