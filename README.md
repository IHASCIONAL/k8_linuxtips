# K8s Notes — LinuxTips

Site estático para centralizar as anotações do treinamento de Kubernetes da LinuxTips, organizadas por dia.

## Como rodar

Os arquivos `.md` são carregados via `fetch`, então é preciso servir os arquivos por HTTP (abrir o `index.html` direto com `file://` não funciona por causa do CORS do navegador).

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Como adicionar um novo dia

1. Crie a pasta `NN_day` (ex: `02_day`).
2. Adicione um ou mais arquivos `.md` com suas anotações.
3. Edite `data/days.json` e adicione uma entrada:

```json
{
  "id": "02",
  "folder": "02_day",
  "title": "Dia 02",
  "description": "Breve descrição do que foi estudado nesse dia.",
  "topics": [
    { "title": "Título da anotação", "file": "nome_do_arquivo.md" }
  ]
}
```

O dia aparecerá automaticamente como um card clicável na página inicial.

## Como adicionar uma nova anotação a um dia existente

1. Crie o arquivo `.md` dentro da pasta do dia correspondente.
2. Adicione um item em `topics` na entrada do dia em `data/days.json`.

## Estrutura

```
index.html          # página inicial (lista de dias)
day.html            # página de um dia (lista de anotações + conteúdo renderizado)
assets/style.css     # tema visual (dark + laranja, estilo LinuxTips)
assets/app.js        # lógica de carregamento e renderização
data/days.json       # manifesto dos dias e anotações
01_day/, 02_day/...  # anotações em markdown, uma pasta por dia
```
