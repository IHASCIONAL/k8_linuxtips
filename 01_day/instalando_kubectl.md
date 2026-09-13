# 🛠️ Instalando o kubectl

> **Resumindo:** o `kubectl` é a CLI usada pra conversar com o cluster (fala com o Kube API Server). Aqui vai o passo a passo de instalação no Linux e o que cada comando faz por baixo dos panos.

## 📥 Download

- Instruções oficiais: https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/

## 🔍 Identificando o arquivo baixado: `file`

> O comando `file` inspeciona o **conteúdo binário** do arquivo — não a extensão — e diz o que ele realmente é.

```bash
$ file kubectl
kubectl: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, Go BuildID=Yh_10CVtjiP_CasB4Brb/qkgd_QP1sXiU6vpGbS0h/xLTMyHW4XNa8NETznGF2/fsmR8H15e2xoEjLtIlX8, BuildID[sha1]=62fae645bcb1a307ee189c37f80ba8a3193dc340, stripped
```

| Parte da saída | O que significa |
|---|---|
| **ELF 64-bit LSB executable** | Formato binário padrão do Linux (*Executable and Linkable Format*), 64 bits, little-endian (byte menos significativo primeiro) |
| **x86-64** | Arquitetura de CPU pra qual o binário foi compilado |
| **version 1 (SYSV)** | Versão do ELF e ABI usada (System V) — praticamente todo binário Linux mostra isso |
| **statically linked** | Não depende de bibliotecas dinâmicas (`.so`) em tempo de execução — o binário já carrega tudo que precisa (comum em binários Go) |
| **Go BuildID=...** | Identificador interno gerado pela toolchain do Go, usado no cache de build do compilador |
| **BuildID[sha1]=...** | Hash único dessa build específica (o `NT_GNU_BUILD_ID` do ELF) — usado por ferramentas de debug/empacotamento pra casar o binário com seus símbolos |
| **stripped** | Os símbolos de debug foram removidos do binário — ele roda normalmente, só não dá pra fazer debug com nome de função/variável direto nele |

> 💡 **Repare:** o arquivo já é um executável de verdade (ELF) — isso é sobre o **formato/conteúdo** do arquivo. Não tem nada a ver com a **permissão** de execução, que é outra camada, controlada pelo Kernel através dos bits do arquivo.

## 🔐 Permissão de execução: `chmod +x`

- **Antes do chmod:** `-rw-r--r--` — dono lê/escreve, grupo lê, outros leem. Nenhuma das três classes tem o bit de execução (`x`), então rodar `./kubectl` dá "Permission denied", mesmo o arquivo sendo um ELF executável válido.
  - Isso não é erro do download: ferramentas de download (navegador, `curl`, `wget`) não ativam o bit de execução por padrão, por segurança — quem decide isso é quem baixa o arquivo.
- **Depois de `chmod +x kubectl`:** `-rwxr-xr-x` — o `+x` (sem especificar `u`, `g` ou `o`) soma o bit de execução nas três classes de uma vez: dono (`rwx`), grupo (`r-x`) e outros (`r-x`). Os bits de leitura que já existiam continuam lá; só o `x` foi adicionado.

```bash
$ ls -lha kubectl
-rw-r--r-- 1 user user 45M ... kubectl

$ chmod +x kubectl
$ ls -lha kubectl
-rwxr-xr-x 1 user user 45M ... kubectl
```

## 📂 Por que mover pra `/usr/local/bin`

- `sudo mv kubectl /usr/local/bin` move o binário pra um diretório que já está no `$PATH` do sistema.
- O `$PATH` é a lista de diretórios que o shell varre quando um comando é digitado sem caminho (`kubectl`, em vez de `./kubectl` ou `/home/usuario/kubectl`). Colocando o binário lá, ele fica disponível de qualquer diretório, pra qualquer usuário do sistema.
- `/usr/local/bin` é convencionalmente reservado pra programas instalados manualmente (fora do gerenciador de pacotes da distro, que usa `/usr/bin`) — por isso pertence ao `root` e exige `sudo` pra escrever ali. É a mesma razão do erro `Permission denied` ao tentar mover sem `sudo`.

> 🔗 **Conexão:** é através do `kubectl` que a pessoa conversa de fato com o **Kube API Server** (ver **Arquitetura do Kubernetes**) — todo `kubectl get`, `kubectl apply` etc. vira uma chamada HTTPS pra porta 6443 do API Server.

## ⚡ Produtividade: autocomplete

Digitar `kubectl` inteiro toda hora cansa. Duas coisas ajudam:

```bash
sudo apt install bash-completion

kubectl completion bash > ~/.kube/completion.bash.inc
echo "source $HOME/.kube/completion.bash.inc" >> $HOME/.bash_profile
source $HOME/.bash_profile
```

- `kubectl completion bash` gera um script que ensina o Bash a autocompletar subcomandos, flags e até nomes de recursos do `kubectl` (com Tab).
- O `source` no `.bash_profile` carrega esse script toda vez que um shell novo abre.

> ⚠️ **Nota:** `.bash_profile` só é lido em shells de **login**. A maioria dos terminais gráficos (inclusive no Ubuntu) abre shells **não-login**, que leem `~/.bashrc` — se o autocomplete não funcionar num terminal novo, adicione a mesma linha `source` no `~/.bashrc` também.

> 👉 **Continua em O que é o kind?**: como criar um cluster de verdade pra usar com o `kubectl`, direto na máquina local, usando Docker.
