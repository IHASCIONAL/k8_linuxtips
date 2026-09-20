# 🗂️ Namespaces

> **Resumindo:** um Namespace divide logicamente os recursos dentro do **mesmo** cluster — é como uma pasta que separa quem é do quê. `kube-system`, por exemplo, é onde vivem os Pods que fazem o próprio Kubernetes funcionar.

## 📦 O que é um Namespace

- Agrupa e isola recursos (Pods, Services, Deployments...) dentro do mesmo cluster físico.
- Todo recurso criado sem indicar um namespace explícito vai pro namespace `default`.
- Alguns namespaces já vêm criados junto com o cluster:

| Namespace | Pra que serve |
|---|---|
| `default` | Onde vão os recursos criados sem indicar um namespace |
| `kube-system` | Onde rodam os Pods que implementam o próprio Kubernetes (API Server, ETCD, Scheduler, Controller Manager, kube-proxy, DNS interno...) |
| `kube-public` | Recursos legíveis por qualquer usuário, até sem autenticação — raramente usado na prática |
| `kube-node-lease` | Guarda os objetos de "lease" de cada Node — o heartbeat que o Kubelet envia periodicamente pra avisar que o Node está vivo |
| `local-path-storage` | Específico do **kind**: roda o provisionador de storage padrão (`local-path-provisioner`), usado quando um Pod pede um volume persistente |

## 🔍 Filtrando por namespace no kubectl

| Flag | O que faz |
|---|---|
| `-n <namespace>` | Mostra recursos só daquele namespace |
| `-A` (ou `--all-namespaces`) | Mostra recursos de **todos** os namespaces de uma vez |
| `-o wide` | Acrescenta colunas extras à saída (ex: em qual Node o Pod está rodando, IP do Pod) |

```bash
kubectl get pods -n kube-system
kubectl get pods -n kube-system -o wide
kubectl get pods -A
```

## 🔬 O que tem dentro do kube-system

Rodando num cluster **kind** com 1 Control Plane + 2 Workers (ver **O que é o kind?**):

```bash
$ kubectl get pods -n kube-system
NAME                                          READY   STATUS    RESTARTS   AGE
coredns-559f6c778d-6vmvq                      1/1     Running   0          2m8s
coredns-559f6c778d-r5cb2                      1/1     Running   0          2m8s
etcd-ihas-control-plane                       1/1     Running   0          2m15s
kindnet-7w2r2                                 1/1     Running   0          2m6s
kindnet-f5knm                                 1/1     Running   0          2m8s
kindnet-k4gxm                                 1/1     Running   0          2m6s
kube-apiserver-ihas-control-plane             1/1     Running   0          2m15s
kube-controller-manager-ihas-control-plane    1/1     Running   0          2m15s
kube-proxy-gt5qt                              1/1     Running   0          2m8s
kube-proxy-nzmcs                              1/1     Running   0          2m6s
kube-proxy-rlw4s                              1/1     Running   0          2m6s
kube-scheduler-ihas-control-plane             1/1     Running   0          2m15s
```

Cada Pod aqui é um componente que já apareceu em **Arquitetura do Kubernetes** — só que rodando de verdade:

| Pod | O que é | Por que essa quantidade |
|---|---|---|
| `etcd-*` | ETCD | 1 — só existe no Node de Control Plane |
| `kube-apiserver-*` | Kube API Server | 1 — só no Control Plane |
| `kube-controller-manager-*` | Kube Controller Manager | 1 — só no Control Plane |
| `kube-scheduler-*` | Kube Scheduler | 1 — só no Control Plane |
| `kube-proxy-*` | kube-proxy (ver **O que é um Service?**) | 1 por Node (3 aqui) — roda em todo Node do cluster |
| `kindnet-*` | Plugin de rede (CNI) padrão do kind — mesmo papel do Weave Net citado na tabela de portas de **Arquitetura do Kubernetes**, só que o kindnet já vem pronto no kind | 1 por Node (3) — mesma lógica do kube-proxy |
| `coredns-*` | Servidor de DNS interno do cluster — resolve nomes como `giropops.default.svc.cluster.local` pro IP do Service correspondente | 2 — roda como Deployment, com 2 réplicas por padrão pra redundância |

> 💡 **Repare:** os 4 componentes do Control Plane e o kube-proxy dos Workers, vistos em teoria em **Arquitetura do Kubernetes**, estão todos aqui — rodando de verdade, como Pods, dentro do próprio cluster.

## 📋 Outros recursos, por todos os namespaces

```bash
kubectl get deployment -A
kubectl get service -A
kubectl get replicaset -A
```

Mostram, respectivamente, os Deployments, Services e ReplicaSets de **todos** os namespaces — útil pra enxergar de uma vez componentes que ficam em namespaces menos óbvios, como o `local-path-storage`.

> 🔗 **Conexão:** quem decidiu que existiriam exatamente 3 Pods de kube-proxy e 3 de kindnet foi a topologia definida no `kind-cluster.yaml` (ver **O que é o kind?**) — 3 Nodes geram 3 Pods de cada um desses componentes, que rodam em todo Node do cluster.

> 👉 **Continua no Dia 02**: como os Pods funcionam de fato — o que são, quem garante que continuam no ar, como expô-los com um Service, e como criar/inspecionar um de verdade com `kubectl`.
