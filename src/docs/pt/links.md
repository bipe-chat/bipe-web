# Links e API pública

Os links que as pessoas compartilham abrem o app do Bipe quando ele está instalado. Sem o app, uma página no bipe.chat explica o próximo passo. Esta página mostra o formato de cada link e as chamadas da API que não pedem login.

## Link de perfil

```
https://bipe.chat/@arroba
```

O @ tem de 2 a 30 caracteres: `a-z`, `0-9`, `.` e `_`.

- Com o app instalado, o link abre a conversa no app (universal link no iPhone, app link no Android).
- Sem o app, a página mostra o @ e o botão para instalar. Quando a pessoa publicou um perfil público, a página mostra também nome, foto e bio, com o aviso "não verificado".
- O número de telefone nunca aparece.

## Link de convite

```
https://bipe.chat/convite/<código>
```

O código tem de 12 a 20 caracteres: `A-Z`, `a-z`, `0-9` e `-`. O código é um segredo que quem convida compartilha.

- A página confere o código em `api.bipe.net.br` e mostra os passos para cada plataforma.
- A página não envia referrer.
- O botão de instalar copia o link do convite. No app, o botão "Colar" da tela inicial usa esse link. Um link da Google Play leva `referrer=convite/<código>`, que o app lê na primeira abertura.
- A prévia do link nunca mostra o código.

## Links de e-mail

A API do Bipe manda dois tipos de link por e-mail. O token vem depois do `#`, então o navegador nunca manda ele para o servidor.

| Link | Função |
|---|---|
| `https://bipe.chat/confirmar-email/#<token>` | Confirma o e-mail de recuperação |
| `https://bipe.chat/recuperar/#<token>` | Abre a recuperação no app. A recuperação nunca roda no navegador |

## Arquivos de link do app

| Arquivo | Plataforma |
|---|---|
| `https://bipe.chat/.well-known/apple-app-site-association` | iPhone. ID do app `chat.bipe.app`. Caminhos `/@*`, `/convite/*`, `/recuperar/*` |
| `https://bipe.chat/.well-known/assetlinks.json` | Android. Pacote `chat.bipe.app` |

## API pública

Endereço base: `https://api.bipe.net.br`. Estas chamadas não pedem login. Todas as outras pedem um token de acesso Matrix de uma conta do Bipe com login.

{{public-api}}

No navegador, só o `https://bipe.chat` pode chamar a API.

O contrato completo da API está em [openapi.yaml](https://github.com/bipe-chat/bipe-shared/blob/main/api/openapi.yaml). O código do servidor está em [bipe-api](https://github.com/bipe-chat/bipe-api).

## O que a API não faz

- Não tem busca de @ nem lista de usuários.
- A busca por número de telefone só acha uma pessoa quando a configuração dela permite.
- Nenhuma chamada devolve um número de telefone.
