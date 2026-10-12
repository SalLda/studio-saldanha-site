# Site Studio Saldanha

Site estático (HTML, CSS e JavaScript puros). Não precisa de build nem de instalação.

## Estrutura

```
index.html      página única
style.css       visual
script.js       botões, formulário, ampliar imagem
assets/         imagens, vídeo e fontes (já otimizados)
```

## Ver no computador

Dentro desta pasta, rode `python3 -m http.server 8000` e abra http://localhost:8000.
(Abrir o `index.html` direto no navegador também funciona, mas o vídeo e as fontes carregam melhor pelo servidor.)

## O que você edita com mais frequência

No topo de `script.js`:

- `WHATSAPP`: número que recebe os pedidos (55 + DDD + número, só dígitos).
- `FORM_ENDPOINT`: opcional. Hoje o formulário abre o WhatsApp com as respostas prontas.
  Se quiser guardar cada pedido mesmo quando a pessoa não envia a mensagem, crie um formulário
  no Formspree (ou similar) e cole o endereço aqui.

Textos: tudo está em `index.html`, em português, na ordem em que aparecem na página.

Cases: ficam em abas na seção `#case` (Shaiane, Varela, Semana Acadêmica). Para trocar uma imagem, substitua o arquivo em `assets/` (WebP) mantendo o nome.

## Publicar (GitHub e Vercel)

1. Criar um repositório no GitHub e enviar o conteúdo desta pasta.
2. Na Vercel, importar o repositório. Framework: "Other". Não há comando de build nem pasta de saída.
3. Cada alteração enviada ao GitHub publica o site de novo sozinha.

Fontes: Fraunces e Space Grotesk, hospedadas em `assets/fonts` (licença SIL Open Font License).
