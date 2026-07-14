# Documentação de Desenvolvimento: Idle Kingdoms Sandbox

Este documento detalha toda a arquitetura visual, mecânicas de jogabilidade, sistemas de dados e progresso do projeto **Idle Kingdoms**, classificando o estado atual dos recursos (funcionais vs. planejados) e apontando as próximas melhorias com base no planejamento de desenvolvimento.

---

## 1. Arquitetura Visual e Sistemas de Cenário

O jogo utiliza um mundo orgânico de **5000x5000 pixels** projetado em Pixel Art, com transições naturais de terreno, efeitos climáticos e iluminação dinâmica.

### Estilo e Filtros de Bioma
* **Montanhas Rochosas (Norte - y < 1400):** Visual acinzentado e nevado, com partículas de neve caindo (`❄️`) e pedregulhos estáticos. As rochas usam filtros de maior contraste e brilho.
* **Floresta Densa (Oeste - x < 2000):** Bosques massivos de carvalhos e pinheiros com dossel fechado. Utiliza filtro de matiz esverdeado úmido (`hue-rotate-[45deg] saturate-[0.8] brightness-[0.6]`) e partículas de folhas caindo (`🌿`).
* **Planícies / Campos Abertos (Centro/Leste):** Gramado limpo com partículas de poeira dourada flutuante (` dustFloat `).
* **Bosque de Outono (Leste - x > 3100, y > 2300, y < 3500):** Um agrupamento de árvores com filtro de matiz quente (`hue-rotate-[-35deg] saturate-[1.3] brightness-[0.95]`), simulando folhas vermelhas e alaranjadas de outono.

### leito do rio e Água Fluida
* O leito do rio foi desenhado utilizando curvas sinuosas SVG com filtros dinâmicos de turbulência fractal e deslocamento (`organic-water` e `organic-sand`), dando um aspecto de pixel art ondulado.
* **Animações de Correnteza:**
  * O `seed` do filtro de ruído é animado continuamente, fazendo com que as margens e a água ondulem de forma orgânica.
  * Ondas de reflexo superficial (`#38bdf8`) com grandes espaçamentos (`strokeDasharray="400, 800"`) deslizam pelo leito.
  * Filetes de espuma branca (`#ffffff`, opacidade `0.5`, `strokeDasharray="220, 660"`) indicam a velocidade do rio.
* **Transição Gradual das Margens:** Camadas subaquáticas de grama escura (`#14532d`), terra (`#78350f`), areia seca (`#d97706`), areia úmida (`#b45309`) e praia clara (`#fef08a`) eliminam a divisão abrupta entre a água e o gramado.

### O RPG Layering (Sistema de Camadas e Y-Sorting)
O renderizador principal separa o DOM em três contêineres de z-index rígidos:
* **Layer 0 (Chão/Terreno - `z-[1]`):** Renderiza o gramado de fundo, a vinheta e o leito orgânico do rio.
* **Layer 1 (Estradas e Pontes - `z-[2]`):** Renderiza as estradas de terra batida (SVG) e a ponte de madeira sobre o rio.
* **Layer 2 (Cenário Estático) e Layer 3 (Entidades Dinâmicas) - `z-[10]`:**
  * Compartilham o mesmo stacking context de rendering.
  * Todas as árvores, veios de ferro, fogueiras, postes de luz, prédios da capital, lotes, monstros, caravanas, jogadores e o World Boss utilizam a propriedade inline `zIndex: Math.floor(y)`.
  * Isso garante o **Y-Sorting Clássico**: entidades renderizam na frente ou atrás de árvores e casas dependendo de sua posição vertical na tela.

### Otimizações de Renderização
* **Viewport Culling 2D:** O `MapRenderer` calcula os limites da tela (viewport com base em tamanho e zoom do jogador) e filtra os vetores de decorações, monstros e recursos. Apenas os elementos visíveis (+ buffer de `250px`) são montados no DOM, reduzindo de 1.500+ elementos para ~100 ativos na tela.
* **Memoização:** Os componentes `ResourceNode` e `MonsterNode` estão envoltos em `React.memo()`, bloqueando re-renderizações redundantes enquanto a câmera se desloca.

---

## 2. Sistemas e Mecânicas de Jogabilidade

### O que JÁ FUNCIONA (Totalmente Operacional)

* **Locomoção do Jogador (Click-to-Move & Natação):**
  * O jogador clica no mapa para mover-se. A velocidade de movimento é reduzida pela metade (`150px/s` para `75px/s`) ao entrar em lagos ou na borda marítima do mapa, ativando partículas de ondulação de água e cortando o sprite do personagem na altura da cintura.
* **Coleta de Recursos (Árvores e Minérios):**
  * Nós de Carvalhos, Pinheiros e Ferro possuem barra de vida (HP) individual.
  * Ao clicar no recurso, o personagem anda até o local e ativa animações de golpes (swing) com o machado ou picareta equipada.
  * O recurso exibe dano flutuante (`FloatingText`), solta partículas de lascas/folhas e reduz seu tamanho visual conforme perde HP, tornando-se um toco inativo ao zerar. Ele regenera passivamente após um tempo.
* **Ciclo Dia e Noite:**
  * O ambiente transiciona sequencialmente a cada 15 segundos: `Dia -> Entardecer -> Noite -> Amanhecer`.
  * Durante a Noite, o mapa recebe uma máscara escura, os postes de iluminação das estradas acendem suas lanternas e as fogueiras emitem uma aura de iluminação tremulante ao seu redor.
* **Bolsa de Valores (Mercado Global Flutuante):**
  * O menu do Mercado local da Vila foi transformado em uma Bolsa de Valores simulada. Os preços dos recursos (Madeira, Pedra e Ferro) oscilam dinamicamente a cada 10 segundos com base em variações de mercado e na lei de oferta/demanda do jogador (comprar encarece o item; vender grandes volumes o satura e desvaloriza).
  * **Eventos Macroeconômicos Globais:** Notificações em banner na tela avisam sobre eventos climáticos/geográficos ("Inverno Rigoroso" aumenta madeira em 50%, "Atividade Vulcânica" reduz ferro em 40%, "Ataque de Piratas" encarece tudo em 30%).
  * **Especulação Visual:** Gráficos SVG vetoriais integrados mostram o histórico de preços de Madeira e Ferro em tempo real.
* **Persistência Híbrida (Supabase Cloud + LocalStorage):**
  * O progresso do jogador (Ouro, Itens, HP, Lotes, Prédios e Trabalhadores) é sincronizado automaticamente com as tabelas do Supabase.
  * Possui fallback automático e transparente para LocalStorage em caso de chaves de API desconfiguradas, com exibição de badge `🔴 Modo Offline` (ou `🟢 Nuvem Ativa` caso conectado).
* **Cálculo de Progresso Offline (Workers Idle):**
  * O jogo registra a saída do jogador. Ao retornar, calcula o tempo decorrido, processa a folha salarial dos trabalhadores contratados e acumula recursos (Madeira, Pedra e Ferro) coletados nesse meio-tempo.
  * O loop corta a produção imediatamente no segundo exato em que o saldo de ouro do jogador zera, prevenindo saldo negativo e exibindo um recibo modal de "Bem-vindo de volta".
* **Forja / Crafting (Evolução de Ferramentas):**
  * Permite fabricar ferramentas como Machado de Pedra, Machado de Ferro e Picareta de Ferro utilizando materiais coletados.
  * Equipar ferramentas melhores aumenta o dano de colheita e reduz o tempo necessário para esgotar árvores e veios de minério.
* **Lotes Residenciais e Construções:**
  * O jogador pode comprar até 4 lotes (plots p1-p4) na praça central por valores progressivos de ouro.
  * Em terrenos comprados, o jogador pode entrar em modo de construção para erguer Barracas, Cabanas e Fogueiras, além de realizar upgrades (evoluir barraca para cabana).
* **Caravanas Logísticas:**
  * Permite carregar recursos excedentes em uma caravana e despachá-la para a Capital.
  * A caravana é vista fisicamente na tela cruzando a estrada até a Cidade Central. Ao chegar, ela converte os recursos em ouro e retorna fisicamente para o lote do jogador.
* **Gerenciamento de Trabalhadores (Workers):**
  * O jogador pode contratar lenhadores e mineradores, definir seus salários por segundo e designá-los para trabalhar em seus lotes residenciais comprados, colhendo recursos de forma passiva no inventário.
* **Combate Básico:**
  * Monstros (Lobos e Orcs) estão distribuídos nas planícies.
  * Clicar no monstro faz o jogador atacá-lo de forma manual ou automática (auto-attack toggle). O combate possui feedback de dano na tela, perda de vida (HP) e recompensas em XP e Ouro ao derrotar o inimigo.
* **Quest Tracker:**
  * Sistema de missões tutoriais ativas (ex: "Colete 10 Madeiras", "Construa uma Barraca", "Derrote 1 Lobo") que guiam a progressão do jogador com recompensas.
* **Barreira de Spawn contra Água:**
  * O gerador procedural e a função de adição de novos lotes residenciais no store (`addPlot`) utilizam a máscara de colisão compartilhada, impedindo fisicamente que recursos ou construções apareçam sobre o rio ou lagos.

### O que AINDA NÃO FUNCIONA (Mockados / Apenas Interface Visual)

* **Multiplayer Realtime Síncrono:**
  * Atualmente, a presença de outros jogadores no mapa (`OtherPlayerNode`) e os lotes residenciais de vizinhos (`OtherPlotNode`) são **simulados localmente**. Um loop de tempo move os avatares de forma artificial pelo cenário, sem sincronização real via conexões de rede ou WebSockets.
* **Chat de Aliança / Guildas:**
  * O painel exibe um chat de aliança estático com mensagens simuladas de Ragnar e Arthas. Não há envio ou recebimento de mensagens em rede real entre jogadores reais.
* **World Boss Raid (Dragão):**
  * O boss de raid (Dragão) aparece no centro inferior com uma barra de HP massiva de 10.000 pontos. Clicar nele aplica dano mockado e reduz a vida, mas a mecânica de combate de raid cooperativa real com padrões de ataque e divisão de espólios síncronos não existe.

---

## 3. Próximas Melhorias Planejadas

Com base nas etapas futuras do planejamento de Idle Kingdoms, as seguintes melhorias devem ser implementadas:

### Fase 1: Multiplayer Síncrono Real (WebSockets & Channels)
* **Sincronização de Posição:** Substituir o loop de simulação mockado pelo **Supabase Realtime Broadcast** ou **Socket.io** para emitir a coordenada `(x, y)` do jogador e atualizar a posição de vizinhos na tela em tempo real.
* **Chat de Aliança Dinâmico:** Integrar o painel da guilda com a tabela `messages` do banco de dados, utilizando ouvintes em tempo real para permitir que jogadores reais troquem mensagens no chat.

### Fase 2: Mecânica de Combate do World Boss Raid
* **Sincronização de HP:** Sincronizar a barra de HP do World Boss Dragon via banco de dados para que todos os jogadores ativos batam no mesmo boss.
* **Inteligência Artificial do Boss:** Criar padrões de ataque reais para o dragão (ex: rajada de fogo em área, atordoamento), exigindo que os jogadores se movam para desviar de projéteis e usem poções.
* **Divisão de Drops Lendários:** Distribuir recompensas de ouro e itens de forma proporcional ao dano causado por cada jogador participante no combate.
* **Sincronização Global da Bolsa de Valores:** Opcionalmente, estender os preços da Bolsa de Valores simulados localmente para preços calculados dinamicamente no servidor em tempo real e compartilhados globalmente entre todos os jogadores.
