# Rumo: como instalar no iPhone

O banco de dados e os lembretes já estão funcionando no Supabase, no mesmo projeto do app dos remédios, mas com dados separados. Falta só publicar o app e instalar no iPhone.

## 1. Publicar o app (GitHub Pages)

1. No GitHub, crie um repositório **público** chamado `rumo`, vazio, sem README.
2. Me avise no chat que eu envio os arquivos. Se preferir enviar você mesmo, use **Add file → Upload files** e mande todo o conteúdo da pasta `site`.
3. No repositório, abra **Settings → Pages**, escolha **Branch: main** e a pasta **/(root)**, e toque em **Save**.
4. Depois de 1 ou 2 minutos, o app fica disponível em **https://gabrielbsilva1987-rgb.github.io/rumo/**.

## 2. Instalar no iPhone

1. Abra o endereço acima no **Safari**.
2. Toque em **Compartilhar → Adicionar à Tela de Início**.
3. Abra o **Rumo pelo ícone** e entre com o **mesmo e-mail e senha do app dos remédios**.
4. Toque em **🔔 Ativar lembretes** e permita as notificações.
5. Em **Ajustes**, toque em **Enviar notificação de teste**. Ela chega em até 1 minuto.

## Lembretes configurados

| Hábito | Quando |
|---|---|
| ☀️ Bom dia (registrar o sono) | 6:10 |
| 📖 Leitura (20 páginas) | 6:30, com reforço às 8:00 |
| 💧 Água (3 L) | A cada 2h, das 7h às 21h, **só se estiver abaixo do ritmo** |
| 🏋️ Treino (seg a sáb) | 18:00, com reforço às 19:00 |
| 🎓 Estudo (30 min, seg a sex) | 20:00, com reforço às 21:00 |
| ✅ Fechamento do dia | 21:30, lista o que falta marcar |
| 🌙 Hora de desacelerar | 22:15, para deitar até 23:00 |
| ⚖️ Pesagem | Domingo, 8:00 |
| 📋 Revisão da semana | Domingo, 17:00, com o resumo da semana |

Você pode mudar tudo em **Ajustes**: metas, horários, dias da semana e tipos de treino. Os lembretes seguem as mudanças na hora.

## Se algo não funcionar

- **A notificação de teste não chega:** confira se o app foi aberto pelo ícone, e não pelo Safari, e se as notificações estão permitidas em *Ajustes do iPhone → Notificações → Rumo*. Depois toque em **Ativar lembretes** de novo.
- **Mudei algo e o iPhone não atualizou:** feche o app (deslize para cima) e abra de novo.
- **O app dos remédios continua igual?** Sim. Os dados do Rumo ficam em tabelas próprias, e o seu pai não tem acesso a eles.

## App Saúde (calorias, passos e treinos)

O iPhone não deixa o Rumo ler o app Saúde diretamente. Quem faz a ponte é o app **Atalhos**: ele lê os dados do dia e envia ao Rumo.

1. No Rumo, abra **Ajustes → App Saúde → Configurar o atalho** e copie o seu endereço pessoal. Não compartilhe esse endereço.
2. Monte o atalho **Rumo Saúde** seguindo o passo a passo que aparece no app:
   - Encontrar Amostras de Saúde (**Energia Ativa**, hoje, agrupado por dia) → **Calcular Estatísticas: Soma**
   - O mesmo para **Passos**
   - Encontrar Amostras de Saúde (**Exercícios**, hoje) → **Contar**
   - **Obter Conteúdo do URL**: POST, JSON, com os campos `calorias`, `passos` e `treinos`
3. Crie uma **automação** diária (ex.: 23:30) com **Executar Imediatamente**.

Treino registrado no Apple Watch ou em outro app marca o **Treino** do dia sozinho. Calorias e passos aparecem em **Hoje** e em **Progresso**, e não entram na % dos hábitos. As metas de calorias e passos são opcionais, em Ajustes.

Se as calorias vierem maiores que no app Saúde, adicione o filtro **Fonte é seu Apple Watch** nas buscas de calorias e passos.
