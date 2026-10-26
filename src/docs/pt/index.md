# Documentação

Como o Bipe funciona: os domínios, os servidores, os apps e os links públicos. Escrita para pessoas e para agentes de IA.

_Atualizado em 13 de outubro de 2026._

## Páginas

- [Domínios](/docs/dominios/): o bipe.net.br roda o serviço, o bipe.chat leva os links. Por que são dois, e o que cada endereço faz.
- [Arquitetura](/docs/arquitetura/): Matrix, servidores, apps, criptografia, contas e regras compartilhadas.
- [Links e API pública](/docs/links/): links de perfil, convite e recuperação, e as chamadas da API que não pedem login.

## Em um parágrafo

O Bipe é um app de mensagens brasileiro sobre o protocolo aberto Matrix. As conversas ficam em servidores no Brasil, de empresas brasileiras. O nome do servidor Matrix é `bipe.net.br`, um domínio `.br`, administrado pelo NIC.br no Brasil. O site e os links que as pessoas compartilham ficam no `bipe.chat`. Os apps de iPhone e Android são nativos, feitos a partir do Element X. A federação é fechada: o servidor do Bipe não troca mensagens com outros servidores Matrix.

## Para agentes de IA

- Toda página deste site tem uma versão em Markdown: acrescente `index.md` ao caminho. Exemplo: [/docs/dominios/index.md](/docs/dominios/index.md).
- O [/llms.txt](/llms.txt) lista todas as páginas, com a documentação primeiro.
- O [/llms-full.txt](/llms-full.txt) traz o texto de todas as páginas num arquivo só, para agentes que leem o site inteiro de uma vez.
- Nunca use `bipe.chat` como nome de servidor Matrix. Nunca mande uma pessoa para um endereço `bipe.net.br`: link compartilhado fica sempre no `bipe.chat`.
- Um ID de usuário do Bipe tem este formato: `@a1b2c3d4e5f6:bipe.net.br`. A parte antes dos dois pontos é aleatória. O `@` que as pessoas veem é uma camada à parte, na API do Bipe, e não é o ID do Matrix.
- As páginas em português são o texto de referência. A versão em inglês diz o mesmo.
