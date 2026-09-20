# 🔍 Explorando Pods em execução

> **Resumindo:** depois de criado, dá pra inspecionar um Pod em detalhe (`describe`, `get -o yaml`), voltar pra dentro dele de duas formas diferentes (`exec` e `attach`), e testar a rede entre Pods — que, por padrão, não tem nenhum tipo de isolamento.

## 🔎 Inspecionando um Pod

```bash
kubectl describe pods giropops
```

- Descrição técnica completa do Pod ativo: eventos, containers, imagem, portas, condições etc.

Outra forma de ver detalhes, dessa vez no formato do próprio manifesto:

```bash
kubectl get pods giropops -o yaml
```

- Devolve a definição do Pod como ele existe **de fato** no cluster — o mesmo `-o yaml` usado com `--dry-run` (ver **kubectl na prática: criando e expondo um Pod**), só que aqui aplicado a um Pod que já existe, com todos os campos preenchidos pelo Kubernetes.

Pra ver o que o container está produzindo em stdout/stderr, sem precisar entrar nele:

```bash
kubectl logs girus
```

- Mostra a saída do processo principal do container — útil pra debugar sem depender de `exec` ou `attach`.

## 🌐 Testando a rede entre Pods

Um curl direto contra o IP de um Pod (aqui, um Pod rodando nginx) não funciona:

```bash
curl 10.244.3.2
```

- O IP de um Pod pertence à rede interna do cluster (o **Pod CIDR**) — só é alcançável de **dentro** do cluster, por outro Pod. De fora dele não existe rota até lá.

Pra testar de verdade, o curl precisa rodar de **dentro** de outro Pod:

```bash
kubectl run girus --image busybox
```

- Cria um Pod sem interatividade: ele sobe "de boa" (feito um daemon), mas sem terminal — faltam os parâmetros de terminal e interatividade pra conseguir interagir com ele.

```bash
kubectl run -it girus --image alpine
```

- `-it` aloca terminal e mantém o stdin aberto — mesma ideia do `-ti` do `kubectl exec` (ver **kubectl na prática**), dessa vez já na criação do Pod.
- A imagem trocada de `busybox` pra `alpine` porque essa já vem com `curl` instalado, o que facilita testar requisições de dentro do Pod.

Com o Pod `girus` interativo rodando, o curl contra o IP do Pod nginx funciona:

```bash
curl 10.244.3.2
```

```html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
</head>
<body>
<h1>Welcome to nginx!</h1>
...
</body>
</html>
```

## 🔌 Voltando pro Pod: `attach` x `exec`

Se sair do Pod `girus`, dá pra voltar assim:

```bash
kubectl attach girus -c girus -it
```

Nem todo Pod aceita `attach`. Um Pod de nginx, por exemplo:

```bash
$ kubectl attach giropops -c giropops -it
error: Unable to use a TTY - container giropops did not allocate one
```

Nesses casos, o jeito é executar um novo processo dentro do container com `kubectl exec` (ver **kubectl na prática**):

```bash
kubectl exec -ti giropops -- bash
root@giropops:/# ls
bin  dev  docker-entrypoint.sh  home  lib64  mnt  proc  root  sbin  sys  usr
boot docker-entrypoint.d  etc
```

| Comando | O que faz | Quando funciona |
|---|---|---|
| `kubectl exec` | Executa um **novo** processo dentro do container (ex: abre um `bash`) | Sempre, desde que o binário exista na imagem |
| `kubectl attach` | Conecta ao **processo principal** (PID 1) do container, o mesmo que já está rodando | Só se esse processo já tiver alocado um TTY |

## ✏️ Editando arquivos dentro do container

Dentro do Pod nginx (via `exec`), dá pra editar o HTML servido:

```bash
root@giropops:/usr/share/nginx/html# ls
50x.html  index.html
root@giropops:/usr/share/nginx/html# echo "EU SOU O CARA" > index.html
root@giropops:/usr/share/nginx/html# cat index.html
EU SOU O CARA
```

E confirmar a mudança fazendo o curl a partir de outro Pod:

```bash
/ # curl 10.244.3.2
EU SOU O CARA
```

- Só funcionou porque a porta 80 foi exposta (`--port 80`) na criação do Pod nginx (ver **kubectl na prática**) — sem isso não haveria nada escutando naquele IP:porta pro curl alcançar.

> ⚠️ **Atenção:** por padrão, não existe nada que limite o acesso de um Pod (ou container) pro outro — qualquer Pod do cluster consegue alcançar qualquer outro pelo IP, sem restrição nenhuma. Isso é resolvido com **Network Policies**, ainda não vistas.
