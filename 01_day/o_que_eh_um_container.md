# 🐳 O que é um Container?

> **Resumindo:** um container é o **isolamento de recursos** de um processo, feito por dois módulos do Kernel Linux — **cgroups** e **namespaces**.

## 📦 Container = isolamento de recursos

"Recurso" aqui não é só CPU e memória — é tudo que um processo pode usar ou tocar.

```mermaid
flowchart TD
    C["🐳 Container"] --> R["isola..."]
    R --> R1["CPU"]
    R --> R2["Memória"]
    R --> R3["I/O"]
    R --> R4["Rede"]
    R --> R5["Processos"]
    R --> R6["Pontos de montagem<br/>(diretórios)"]
    R --> R7["Tabela de usuários"]
```

## ⚙️ O que é um processo?

> Tudo o que está **em execução**: um aplicativo, um script qualquer, até o `ls` — enquanto ele está rodando, é um processo.

## 🧩 Os dois módulos do Kernel por trás do isolamento

| Módulo | Isola o quê | Onde vive |
|---|---|---|
| **cgroups** | CPU, Memória | Kernel |
| **namespaces** | Usuários, Processos, Pontos de montagem, Rede | Kernel |

```mermaid
flowchart LR
    K["🐧 Kernel Linux"] --> CG["cgroups"]
    K --> NS["namespaces"]

    CG --> CG1["CPU"]
    CG --> CG2["Memória"]

    NS --> NS1["Usuários"]
    NS --> NS2["Processos"]
    NS --> NS3["Pontos de montagem"]
    NS --> NS4["Rede"]
```

✅ **Vantagem:** como o container só enxerga e usa o que foi isolado pra ele, **não consome recursos desnecessários** — diferente de uma máquina virtual, que carrega um SO inteiro.

> 👉 Continua em **Container Engine & Runtime**: quem de fato cria e executa o container usando esse isolamento.
