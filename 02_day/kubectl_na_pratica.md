# 🧪 kubectl na prática: criando e expondo um Pod

> **Resumindo:** dá pra criar e expor um Pod diretamente com `kubectl`, sem escrever nenhum YAML — bom pra testar rápido, mas sem as garantias de um Deployment.

## 🚀 Criando um Pod: `kubectl run`

```bash
$ kubectl run giropops --image nginx --port 80
pod/giropops created
```

- Cria um Pod chamado `giropops`, usando a imagem `nginx`, expondo a porta 80 do container.
- ⚠️ **Ponto de atenção:** diferente do fluxo normal — Deployment → ReplicaSet → Pod (ver **O que é um Pod?**) — o `kubectl run` cria um Pod **solto**, sem nenhum controller cuidando dele. Se esse Pod morrer, ninguém recria; não existe ReplicaSet por trás.

## 🧪 Simulando antes de criar: `--dry-run`

```bash
kubectl run giropops --image nginx --port 80 --dry-run=client
```

- `--dry-run=client` roda o comando "de brincadeirinha": valida a sintaxe e mostra o que seria criado, mas não cria nada de fato no cluster.

## 📄 Gerando o YAML equivalente: `-o yaml`

```bash
kubectl run giropops --image nginx --port 80 --dry-run=client -o yaml
```

- `-o` (`--output`) formata a saída do comando de acordo com o parâmetro pedido — aqui, `yaml`.
- Combinado com `--dry-run=client`, gera o manifesto YAML equivalente ao Pod que seria criado, sem de fato criá-lo — útil pra partir de um YAML pronto em vez de escrever um do zero.

## 💾 Salvando a saída em arquivo

```bash
kubectl run giropops --image nginx --port 80 --dry-run=client -o yaml > pod.yaml
```

- O `>` redireciona a saída do comando para um arquivo (`pod.yaml`) em vez de imprimir no terminal.

## ✅ Criando a partir de um arquivo: `kubectl apply -f`

```bash
kubectl apply -f pod.yaml
```

- `apply -f` cria (ou atualiza) recursos no cluster a partir de um arquivo de configuração — nesse caso, o Pod descrito em `pod.yaml`.

## 🔁 Limitação do `apply` em atualizações

```bash
$ kubectl apply -f pod.yaml
The Pod "girus" is invalid: spec.containers: Forbidden: pod updates may not add or remove containers
```

- `apply -f` também serve pra **atualizar** um recurso já existente a partir do arquivo — mas nem toda mudança é permitida num Pod já criado: não dá pra adicionar ou remover containers de um Pod existente.
- Nesses casos, é preciso derrubar o Pod antes e recriar:

```bash
kubectl delete -f pod.yaml
kubectl apply -f pod.yaml
```

## 💻 Entrando no Pod: `kubectl exec`

```bash
kubectl exec -ti giropops -- bash
```

- `-t` aloca um terminal (tty); `-i` mantém o stdin aberto pra interação.
- Tudo depois do `--` é o comando executado **dentro** do container — nesse caso, abre um shell `bash`.

## ⌨️ Apelido pra digitar menos

```bash
alias k=kubectl
```

Coloque num arquivo lido ao abrir o terminal (`~/.bashrc` na maioria dos terminais gráficos, ou `~/.bash_profile` em shells de login — ver **Instalando o kubectl**) pra valer em toda sessão nova.

## 🌐 Expondo o Pod: `kubectl expose`

```bash
$ k expose pods giropops
service/giropops exposed

$ k get svc
NAME         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
giropops     ClusterIP   10.96.59.218   <none>        80/TCP    2s
kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP   32m
```

- `kubectl expose` cria um **Service** (ver **O que é um Service?**) usando as próprias labels do Pod como selector, e reaproveita a porta do container (80) automaticamente.
- Por padrão, o tipo é `ClusterIP` — só acessível de dentro do cluster.
- O Service `kubernetes` já vem criado desde o início do cluster, no namespace `default` (ver **Namespaces**) — é ele quem aponta pro Kube API Server. A porta 443 aqui é a porta do **Service**, não a 6443 do API Server — o Service faz esse meio de campo.

## 🗑️ Apagando o Service

```bash
k delete svc giropops
```

## 🚪 Expondo pra fora do cluster: NodePort

```bash
$ k expose pods giropops --type NodePort
service/giropops exposed

$ k get svc
NAME         TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
giropops     NodePort   10.96.48.168   <none>        80:32471/TCP   2s
kubernetes   ClusterIP  10.96.0.1      <none>        443/TCP        33m
```

- `80:32471/TCP` = porta 80 do Service (uso interno, ClusterIP) mapeada pra porta **32471** em todo Worker do cluster — dentro da faixa 30000–32767 documentada em **Arquitetura do Kubernetes**.
- O número exato dentro da faixa é escolhido automaticamente pelo Kubernetes (dá pra fixar manualmente com `--node-port`, mas não é o padrão).

> 🔗 **Conexão:** essa é a mesma mecânica de NodePort explicada em **O que é um Service?** — só que aqui aplicada a um Pod real, dentro do cluster kind criado em **O que é o kind?**.

> 👉 **Continua em Explorando Pods em execução**: como inspecionar um Pod já criado em detalhe, entrar nele de duas formas diferentes, e testar a rede entre Pods.
