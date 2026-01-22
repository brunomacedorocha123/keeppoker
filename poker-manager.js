/**
 * SISTEMA COMPLETO DE GERENCIAMENTO DE POKER
 * Arquivo: poker-manager.js
 * Responsável por: Orquestrar todos os módulos, gerenciar estado do jogo, comunicação
 */

// Importa todos os módulos (em produção, seriam imports ES6)
// Para este exemplo, assumimos que as classes estão disponíveis globalmente

// ================ CONSTANTES DO SISTEMA ================
export const GAME_STATES = {
    LOBBY: 'lobby',           // Na sala de espera
    STARTING: 'starting',     // Iniciando jogo
    PREFLOP: 'preflop',       // Rodada de preflop
    FLOP: 'flop',             // Rodada de flop
    TURN: 'turn',             // Rodada de turn
    RIVER: 'river',           // Rodada de river
    SHOWDOWN: 'showdown',    // Mostrando cartas
    DISTRIBUTING: 'distributing', // Distribuindo pote
    BETWEEN_HANDS: 'between_hands', // Entre mãos
    PAUSED: 'paused',         // Jogo pausado
    FINISHED: 'finished'      // Jogo finalizado
};

export const ACTION_TYPES = {
    FOLD: 'fold',
    CHECK: 'check',
    CALL: 'call',
    BET: 'bet',
    RAISE: 'raise',
    ALL_IN: 'allin',
    TIMEOUT: 'timeout'
};

// ================ CLASSE GERENCIADORA PRINCIPAL ================
export class PokerGameManager {
    constructor(config = {}) {
        // Configuração
        this.gameId = config.gameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = config.name || 'Mesa de Poker';
        this.gameType = config.gameType || 'tournament'; // 'tournament' ou 'cash'
        this.maxPlayers = config.maxPlayers || 9;
        this.minPlayers = config.minPlayers || 2;
        this.startingStack = config.startingStack || 1500;
        this.smallBlind = config.smallBlind || 10;
        this.bigBlind = config.bigBlind || 20;
        this.ante = config.ante || 0;
        this.actionTime = config.actionTime || 30; // segundos
        this.isPrivate = config.isPrivate || false;
        this.password = config.password || null;
        
        // Estado do jogo
        this.state = GAME_STATES.LOBBY;
        this.currentRound = 'preflop';
        this.handNumber = 0;
        this.dealerPosition = 0;
        this.smallBlindPosition = 0;
        this.bigBlindPosition = 0;
        this.currentPlayerTurn = null;
        this.currentMaxBet = 0;
        this.lastRaiseAmount = 0;
        this.lastAction = null;
        
        // Módulos
        this.deck = null;           // Instância de PokerDeck
        this.playerManager = null;  // Instância de PlayerManager
        this.potManager = null;     // Instância de PotManager
        this.tournament = null;     // Instância de PokerTournament (se for torneio)
        this.handEvaluator = null;  // Instância de HandEvaluator
        
        // Controle
        this.actionTimer = null;
        this.actionTimeRemaining = this.actionTime;
        this.handStartTime = null;
        this.roundStartTime = null;
        this.isPaused = false;
        this.pauseStartTime = null;
        this.totalPauseTime = 0;
        
        // Comunicação
        this.eventListeners = new Map();
        this.messageQueue = [];
        this.broadcastEnabled = true;
        
        // Estatísticas
        this.stats = {
            totalHands: 0,
            totalPots: 0,
            biggestPot: 0,
            averagePot: 0,
            fastestHand: null,
            mostActivePlayer: null,
            playersJoined: 0,
            playersLeft: 0
        };
        
        // Histórico
        this.handHistory = [];
        this.actionHistory = [];
        this.chatHistory = [];
        this.errorLog = [];
        
        // Configurações avançadas
        this.settings = {
            autoMuckLosingHands: true,
            showWinningHand: true,
            allowChat: true,
            allowEmotes: true,
            allowTimeBank: true,
            timeBankSeconds: 30,
            maxTimeBanks: 3,
            minRaise: 'pot', // 'pot' ou 'fixed'
            allowStraddle: false,
            allowRunningItTwice: false,
            rabbitHunt: false
        };
        
        // Inicialização diferida
        this.initialized = false;
        
        console.log(`🎮 PokerGameManager criado: ${this.name} (${this.gameId})`);
    }
    
    // ================ INICIALIZAÇÃO ================
    
    // Inicializa o jogo com todos os módulos
    async initialize() {
        if (this.initialized) {
            console.warn('⚠️ Jogo já inicializado');
            return false;
        }
        
        try {
            console.log('🔄 Inicializando PokerGameManager...');
            
            // Inicializa módulos
            this.initializeModules();
            
            // Configura listeners
            this.setupEventListeners();
            
            // Inicializa estado
            this.resetGameState();
            
            this.initialized = true;
            
            console.log('✅ PokerGameManager inicializado com sucesso');
            this.emit('game_initialized', { gameId: this.gameId, name: this.name });
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.logError('initialize_failed', error);
            return false;
        }
    }
    
    // Inicializa todos os módulos necessários
    initializeModules() {
        // Deck
        this.deck = new PokerDeck();
        this.deck.reset();
        this.deck.shuffle();
        
        // Gerenciador de jogadores
        this.playerManager = new PlayerManager(this.maxPlayers);
        
        // Gerenciador de pote
        this.potManager = new PotManager();
        
        // Avaliador de mãos
        this.handEvaluator = new HandEvaluator();
        
        // Torneio (se aplicável)
        if (this.gameType === 'tournament') {
            this.tournament = new PokerTournament({
                id: this.gameId,
                name: this.name,
                maxPlayers: this.maxPlayers,
                startingStack: this.startingStack
            });
        }
        
        console.log('📦 Módulos inicializados');
    }
    
    // Configura listeners internos
    setupEventListeners() {
        // Timer de ação
        this.on('action_timer_tick', (data) => {
            this.handleActionTimer(data);
        });
        
        // Eventos de jogador
        this.on('player_action', (data) => {
            this.handlePlayerAction(data);
        });
        
        // Eventos de sistema
        this.on('system_pause', () => {
            this.pauseGame();
        });
        
        this.on('system_resume', () => {
            this.resumeGame();
        });
        
        console.log('🎯 Listeners configurados');
    }
    
    // ================ GERENCIAMENTO DE JOGADORES ================
    
    // Adiciona jogador ao jogo
    addPlayer(userId, nickname, chips = null, isBot = false) {
        if (!this.initialized) {
            throw new Error('Jogo não inicializado');
        }
        
        if (this.state !== GAME_STATES.LOBBY && this.state !== GAME_STATES.BETWEEN_HANDS) {
            throw new Error('Não é possível adicionar jogadores durante uma mão');
        }
        
        // Verifica se jogador já existe
        if (this.playerManager.getPlayerById(userId)) {
            throw new Error('Jogador já está na mesa');
        }
        
        // Determina fichas iniciais
        const startingChips = chips !== null ? chips : this.startingStack;
        
        // Adiciona jogador
        const player = this.playerManager.addPlayer(userId, nickname, startingChips, isBot);
        
        // Se for torneio, registra no torneio também
        if (this.tournament) {
            this.tournament.registerPlayer(userId, nickname, isBot);
        }
        
        this.stats.playersJoined++;
        
        // Emite evento
        this.emit('player_joined', {
            playerId: userId,
            nickname: nickname,
            chips: startingChips,
            position: player.position,
            isBot: isBot,
            totalPlayers: this.playerManager.players.length
        });
        
        console.log(`👤 ${nickname} entrou no jogo`);
        
        // Verifica se pode começar
        this.checkIfCanStart();
        
        return player;
    }
    
    // Remove jogador do jogo
    removePlayer(userId, reason = 'left') {
        if (!this.playerManager.getPlayerById(userId)) {
            return false;
        }
        
        const player = this.playerManager.getPlayerById(userId);
        
        // Se estiver em uma mão ativa, faz fold automático
        if (this.state !== GAME_STATES.LOBBY && 
            this.state !== GAME_STATES.BETWEEN_HANDS &&
            this.state !== GAME_STATES.FINISHED) {
            
            // Executa fold forçado
            this.forcePlayerFold(userId);
        }
        
        // Remove do gerenciador
        this.playerManager.removePlayer(userId);
        
        // Se for torneio, marca como eliminado
        if (this.tournament && player) {
            this.tournament.eliminatePlayer(userId, null, 'left_game');
        }
        
        this.stats.playersLeft++;
        
        // Emite evento
        this.emit('player_left', {
            playerId: userId,
            nickname: player?.nickname,
            reason: reason,
            totalPlayers: this.playerManager.players.length
        });
        
        console.log(`🚪 ${player?.nickname || userId} saiu do jogo (${reason})`);
        
        // Verifica se jogo deve terminar
        this.checkIfGameShouldEnd();
        
        return true;
    }
    
    // Força fold de jogador (para desconexão, etc)
    forcePlayerFold(playerId) {
        const player = this.playerManager.getPlayerById(playerId);
        if (!player || !player.isInHand) return false;
        
        // Executa ação de fold
        player.takeAction('fold', 0, { currentMaxBet: this.currentMaxBet });
        
        // Remove do pote
        this.potManager.playerFolds(playerId);
        
        // Verifica se é a vez do jogador
        if (this.currentPlayerTurn === playerId) {
            this.advanceTurn();
        }
        
        console.log(`⚡ ${player.nickname} foldou forçadamente`);
        return true;
    }
    
    // ================ INÍCIO DO JOGO ================
    
    // Verifica se pode iniciar o jogo
    checkIfCanStart() {
        if (this.state !== GAME_STATES.LOBBY) return;
        
        const eligiblePlayers = this.playerManager.getPlayersEligibleForCards();
        
        if (eligiblePlayers.length >= this.minPlayers) {
            console.log(`✅ ${eligiblePlayers.length} jogadores prontos - pode iniciar`);
            this.emit('game_can_start', {
                playerCount: eligiblePlayers.length,
                minPlayers: this.minPlayers
            });
        }
    }
    
    // Inicia uma nova mão
    startNewHand() {
        if (!this.canStartNewHand()) {
            throw new Error('Não pode iniciar nova mão no momento');
        }
        
        console.log(`🃏 Iniciando nova mão #${this.handNumber + 1}`);
        
        // Atualiza estado
        this.state = GAME_STATES.STARTING;
        this.handNumber++;
        this.handStartTime = new Date();
        this.currentRound = 'preflop';
        this.currentMaxBet = 0;
        this.lastRaiseAmount = 0;
        this.lastAction = null;
        
        // Emite evento de início
        this.emit('hand_starting', {
            handNumber: this.handNumber,
            dealerPosition: this.dealerPosition,
            playersInHand: this.playerManager.getPlayersInHand().length
        });
        
        // Reset módulos para nova mão
        this.resetForNewHand();
        
        // Distribui posições
        this.assignPositions();
        
        // Embaralha e distribui cartas
        this.dealCards();
        
        // Aplica blinds
        this.postBlinds();
        
        // Determina primeiro jogador a agir
        this.determineFirstToAct();
        
        // Inicia o jogo
        this.state = GAME_STATES.PREFLOP;
        this.roundStartTime = new Date();
        
        console.log(`🚀 Mão #${this.handNumber} iniciada`);
        
        // Inicia timer do primeiro jogador
        this.startActionTimer();
        
        // Emite evento de mão iniciada
        this.emit('hand_started', this.getGameState());
        
        return this.getGameState();
    }
    
    // Verifica se pode iniciar nova mão
    canStartNewHand() {
        if (this.state !== GAME_STATES.LOBBY && 
            this.state !== GAME_STATES.BETWEEN_HANDS) {
            return false;
        }
        
        const eligiblePlayers = this.playerManager.getPlayersEligibleForCards();
        return eligiblePlayers.length >= this.minPlayers;
    }
    
    // Reseta estado para nova mão
    resetForNewHand() {
        // Reset deck
        this.deck.restoreUsedCards();
        this.deck.shuffle();
        
        // Reset jogadores
        this.playerManager.resetAllForNewHand();
        
        // Reset pote
        this.potManager.resetForNewHand();
        
        // Reset variáveis de controle
        this.currentMaxBet = 0;
        this.lastRaiseAmount = 0;
        this.lastAction = null;
        
        console.log('🔄 Estado resetado para nova mão');
    }
    
    // Distribui posições (dealer, blinds)
    assignPositions() {
        const activePlayers = this.playerManager.getActivePlayers();
        if (activePlayers.length === 0) return;
        
        // Avança dealer
        this.dealerPosition = (this.dealerPosition + 1) % activePlayers.length;
        
        // Calcula posições dos blinds
        this.smallBlindPosition = (this.dealerPosition + 1) % activePlayers.length;
        this.bigBlindPosition = (this.dealerPosition + 2) % activePlayers.length;
        
        // Atribui posições aos jogadores
        this.playerManager.assignSpecialPositions(
            this.dealerPosition,
            this.smallBlindPosition,
            this.bigBlindPosition
        );
        
        console.log(`👑 Dealer: pos ${this.dealerPosition}, SB: ${this.smallBlindPosition}, BB: ${this.bigBlindPosition}`);
    }
    
    // Distribui cartas
    dealCards() {
        const players = this.playerManager.getPlayersEligibleForCards();
        
        // Distribui 2 cartas para cada jogador
        players.forEach(player => {
            const cards = this.deck.deal(2, false); // Cartas viradas para baixo
            player.dealCards(cards);
            
            // Emite evento para o jogador específico
            this.emitToPlayer(player.userId, 'cards_dealt', {
                cards: cards.map(c => c.display),
                handNumber: this.handNumber
            });
        });
        
        console.log(`🃏 Cartas distribuídas para ${players.length} jogadores`);
    }
    
    // Aplica blinds obrigatórios
    postBlinds() {
        const activePlayers = this.playerManager.getActivePlayers();
        
        // Small Blind
        if (activePlayers[this.smallBlindPosition]) {
            const sbPlayer = activePlayers[this.smallBlindPosition];
            const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
            
            sbPlayer.addToBet(sbAmount);
            this.potManager.addBet(sbPlayer.userId, sbAmount);
            this.currentMaxBet = sbAmount;
            
            sbPlayer.lastAction = 'small blind';
            sbPlayer.hasActedThisRound = true;
            
            console.log(`💰 Small Blind: ${sbPlayer.nickname} apostou ${sbAmount}`);
        }
        
        // Big Blind
        if (activePlayers[this.bigBlindPosition]) {
            const bbPlayer = activePlayers[this.bigBlindPosition];
            const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
            
            bbPlayer.addToBet(bbAmount);
            this.potManager.addBet(bbPlayer.userId, bbAmount);
            this.currentMaxBet = bbAmount;
            
            bbPlayer.lastAction = 'big blind';
            bbPlayer.hasActedThisRound = true;
            
            console.log(`💰 Big Blind: ${bbPlayer.nickname} apostou ${bbAmount}`);
        }
        
        // Ante (se houver)
        if (this.ante > 0) {
            activePlayers.forEach(player => {
                if (player.position !== this.smallBlindPosition && 
                    player.position !== this.bigBlindPosition) {
                    
                    const anteAmount = Math.min(this.ante, player.chips);
                    if (anteAmount > 0) {
                        player.addToBet(anteAmount);
                        this.potManager.addBet(player.userId, anteAmount);
                        
                        player.lastAction = 'ante';
                        console.log(`💰 Ante: ${player.nickname} pagou ${anteAmount}`);
                    }
                }
            });
        }
    }
    
    // ================ GERENCIAMENTO DE TURNOS ================
    
    // Determina primeiro jogador a agir
    determineFirstToAct() {
        const playersInHand = this.playerManager.getPlayersInHand();
        if (playersInHand.length === 0) return null;
        
        let startPosition;
        
        if (this.currentRound === 'preflop') {
            // No preflop, começa após o big blind
            startPosition = (this.bigBlindPosition + 1) % playersInHand.length;
        } else {
            // Nas outras rodadas, começa após o dealer
            startPosition = (this.dealerPosition + 1) % playersInHand.length;
        }
        
        // Encontra próximo jogador que pode agir
        for (let i = 0; i < playersInHand.length; i++) {
            const index = (startPosition + i) % playersInHand.length;
            const player = playersInHand[index];
            
            if (this.canPlayerAct(player.userId)) {
                this.currentPlayerTurn = player.userId;
                player.isCurrentTurn = true;
                
                console.log(`🎯 Primeiro a agir: ${player.nickname}`);
                return player.userId;
            }
        }
        
        this.currentPlayerTurn = null;
        return null;
    }
    
    // Avança para próximo jogador
    advanceTurn() {
        const currentPlayer = this.playerManager.getPlayerById(this.currentPlayerTurn);
        if (currentPlayer) {
            currentPlayer.isCurrentTurn = false;
        }
        
        const playersInHand = this.playerManager.getPlayersInHand();
        if (playersInHand.length === 0) {
            this.currentPlayerTurn = null;
            return null;
        }
        
        // Encontra índice do jogador atual
        const currentIndex = playersInHand.findIndex(p => p.userId === this.currentPlayerTurn);
        let nextIndex = currentIndex;
        
        // Procura próximo jogador que pode agir
        for (let i = 1; i <= playersInHand.length; i++) {
            nextIndex = (currentIndex + i) % playersInHand.length;
            const nextPlayer = playersInHand[nextIndex];
            
            if (this.canPlayerAct(nextPlayer.userId)) {
                this.currentPlayerTurn = nextPlayer.userId;
                nextPlayer.isCurrentTurn = true;
                
                console.log(`🔄 Turno avançado para: ${nextPlayer.nickname}`);
                
                // Inicia timer para novo jogador
                this.startActionTimer();
                
                return nextPlayer.userId;
            }
        }
        
        // Se ninguém pode agir, termina rodada
        this.currentPlayerTurn = null;
        this.checkRoundCompletion();
        
        return null;
    }
    
    // Verifica se jogador pode agir
    canPlayerAct(playerId) {
        const player = this.playerManager.getPlayerById(playerId);
        if (!player) return false;
        
        return player.isInHand && 
               !player.isFolded && 
               !player.isAllIn && 
               !player.hasActedThisRound;
    }
    
    // ================ GERENCIAMENTO DE AÇÕES ================
    
    // Processa ação do jogador
    processPlayerAction(playerId, action, amount = 0) {
        if (!this.initialized) {
            throw new Error('Jogo não inicializado');
        }
        
        if (this.state !== GAME_STATES.PREFLOP &&
            this.state !== GAME_STATES.FLOP &&
            this.state !== GAME_STATES.TURN &&
            this.state !== GAME_STATES.RIVER) {
            throw new Error('Não é hora de agir');
        }
        
        if (this.currentPlayerTurn !== playerId) {
            throw new Error('Não é sua vez');
        }
        
        const player = this.playerManager.getPlayerById(playerId);
        if (!player) {
            throw new Error('Jogador não encontrado');
        }
        
        console.log(`🎯 Processando ação: ${player.nickname} - ${action} ${amount > 0 ? amount : ''}`);
        
        try {
            // Valida ação
            this.validateAction(player, action, amount);
            
            // Executa ação
            const actionResult = player.takeAction(action, amount, {
                currentMaxBet: this.currentMaxBet,
                currentRound: this.currentRound
            });
            
            // Atualiza pote
            if (actionResult.amount > 0) {
                const potResult = this.potManager.addBet(playerId, actionResult.amount, player.chips);
                
                // Atualiza currentMaxBet se necessário
                if (['bet', 'raise', 'allin'].includes(action)) {
                    this.currentMaxBet = Math.max(this.currentMaxBet, player.bet);
                    this.lastRaiseAmount = action === 'raise' ? amount : 0;
                }
            }
            
            // Registra última ação
            this.lastAction = {
                playerId: playerId,
                action: action,
                amount: actionResult.amount,
                timestamp: new Date()
            };
            
            // Adiciona ao histórico
            this.actionHistory.push({
                handNumber: this.handNumber,
                round: this.currentRound,
                ...this.lastAction
            });
            
            // Para ação
            this.stopActionTimer();
            
            // Emite evento da ação
            this.emit('player_action_processed', {
                playerId: playerId,
                nickname: player.nickname,
                action: action,
                amount: actionResult.amount,
                newStack: player.chips,
                currentMaxBet: this.currentMaxBet,
                potTotal: this.potManager.totalAmount
            });
            
            // Avança turno ou verifica fim da rodada
            if (!this.isRoundComplete()) {
                this.advanceTurn();
            } else {
                this.checkRoundCompletion();
            }
            
            return {
                success: true,
                action: action,
                amount: actionResult.amount,
                player: player.toJSON(),
                gameState: this.getGameState()
            };
            
        } catch (error) {
            console.error(`❌ Erro na ação ${action}:`, error);
            this.logError('action_failed', error, { playerId, action, amount });
            
            throw error;
        }
    }
    
    // Valida ação do jogador
    validateAction(player, action, amount) {
        const playerChips = player.chips;
        const playerBet = player.bet;
        
        switch(action.toLowerCase()) {
            case 'fold':
                // Fold sempre válido
                break;
                
            case 'check':
                if (!player.canCheck(this.currentMaxBet)) {
                    throw new Error('Não pode dar check, precisa igualar a aposta');
                }
                break;
                
            case 'call':
                const callAmount = player.getCallAmount(this.currentMaxBet);
                if (callAmount > playerChips) {
                    throw new Error('Fichas insuficientes para call');
                }
                break;
                
            case 'bet':
                if (this.currentMaxBet > 0) {
                    throw new Error('Não pode fazer bet quando já há apostas');
                }
                if (amount <= 0) {
                    throw new Error('Valor de bet inválido');
                }
                if (amount > playerChips) {
                    throw new Error('Fichas insuficientes');
                }
                if (amount < this.bigBlind) {
                    throw new Error(`Bet mínimo: ${this.bigBlind}`);
                }
                break;
                
            case 'raise':
                if (this.currentMaxBet === 0) {
                    throw new Error('Não pode fazer raise sem apostas anteriores');
                }
                
                const minRaise = this.calculateMinRaise();
                if (amount < minRaise && playerChips >= minRaise) {
                    throw new Error(`Raise mínimo: ${minRaise}`);
                }
                
                const totalToCall = playerBet + amount;
                if (totalToCall > playerChips + playerBet) {
                    throw new Error('Fichas insuficientes');
                }
                break;
                
            case 'allin':
                if (playerChips <= 0) {
                    throw new Error('Sem fichas para all-in');
                }
                break;
                
            default:
                throw new Error(`Ação inválida: ${action}`);
        }
    }
    
    // Calcula raise mínimo
    calculateMinRaise() {
        if (this.currentMaxBet === 0) {
            return this.bigBlind; // Bet mínimo é o big blind
        }
        
        if (this.lastRaiseAmount > 0) {
            return this.currentMaxBet + this.lastRaiseAmount;
        }
        
        return this.currentMaxBet * 2;
    }
    
    // ================ GERENCIAMENTO DE RODADAS ================
    
    // Verifica se rodada está completa
    isRoundComplete() {
        const playersInHand = this.playerManager.getPlayersInHand();
        if (playersInHand.length <= 1) return true;
        
        // Verifica se todos jogadores ativos já agiram
        const allActed = playersInHand.every(p => 
            p.hasActedThisRound || p.isAllIn || p.isFolded
        );
        
        if (!allActed) return false;
        
        // Verifica se todas apostas estão igualadas
        return playersInHand.every(p => 
            p.isAllIn || p.isFolded || p.bet === this.currentMaxBet
        );
    }
    
    // Verifica e processa conclusão da rodada
    checkRoundCompletion() {
        if (!this.isRoundComplete()) return;
        
        console.log(`✅ Rodada ${this.currentRound} completa`);
        
        // Avança para próxima rodada ou vai para showdown
        switch(this.currentRound) {
            case 'preflop':
                this.dealCommunityCards(3); // Flop
                this.currentRound = 'flop';
                break;
                
            case 'flop':
                this.dealCommunityCards(1); // Turn
                this.currentRound = 'turn';
                break;
                
            case 'turn':
                this.dealCommunityCards(1); // River
                this.currentRound = 'river';
                break;
                
            case 'river':
                this.goToShowdown();
                return;
        }
        
        // Reseta estado para nova rodada
        this.resetForNewRound();
        
        // Determina próximo jogador
        this.determineFirstToAct();
        
        // Atualiza estado
        this.state = this.currentRound.toUpperCase();
        this.roundStartTime = new Date();
        
        // Emite evento
        this.emit('round_completed', {
            round: this.currentRound,
            communityCards: this.potManager.communityCards,
            potTotal: this.potManager.totalAmount,
            nextPlayer: this.currentPlayerTurn
        });
        
        // Inicia timer se houver jogador
        if (this.currentPlayerTurn) {
            this.startActionTimer();
        }
    }
    
    // Distribui cartas comunitárias
    dealCommunityCards(count) {
        // Queima uma carta
        this.deck.burnCard();
        
        // Distribui cartas
        const cards = this.deck.deal(count, true); // Viradas para cima
        
        // Adiciona ao pote manager (se tiver método)
        if (this.potManager.communityCards) {
            this.potManager.communityCards.push(...cards);
        }
        
        console.log(`🃏 ${count} carta(s) comunitária(s): ${cards.map(c => c.display).join(' ')}`);
        
        // Emite evento
        this.emit('community_cards_dealt', {
            count: count,
            cards: cards.map(c => c.display),
            round: this.currentRound,
            totalCards: cards.length
        });
    }
    
    // Reseta estado para nova rodada
    resetForNewRound() {
        const players = this.playerManager.getPlayersInHand();
        
        players.forEach(player => {
            player.hasActedThisRound = false;
            player.bet = 0;
            player.lastAction = null;
        });
        
        this.currentMaxBet = 0;
        this.lastRaiseAmount = 0;
        this.lastAction = null;
        
        console.log(`🔄 Estado resetado para rodada ${this.currentRound}`);
    }
    
    // ================ SHOWDOWN E DISTRIBUIÇÃO ================
    
    // Vai para showdown
    goToShowdown() {
        console.log('🏆 SHOWDOWN!');
        
        this.state = GAME_STATES.SHOWDOWN;
        
        // Encontra jogadores ainda na mão
        const playersInShowdown = this.playerManager.getPlayersInHand()
            .filter(p => !p.isFolded);
        
        // Se só tem um jogador, ele ganha automaticamente
        if (playersInShowdown.length === 1) {
            const winner = playersInShowdown[0];
            this.distributePot([winner.userId]);
            return;
        }
        
        // Avalia mãos de todos jogadores
        const handEvaluations = this.evaluateAllHands(playersInShowdown);
        
        // Encontra vencedor(es)
        const winners = this.determineWinners(handEvaluations);
        
        // Distribui pote
        this.distributePot(winners, handEvaluations);
    }
    
    // Avalia mãos de todos jogadores
    evaluateAllHands(players) {
        const evaluations = {};
        const communityCards = this.getCommunityCards();
        
        players.forEach(player => {
            if (player.cards && player.cards.length === 2) {
                const evaluation = this.handEvaluator.evaluate(player.cards, communityCards);
                evaluations[player.userId] = evaluation;
                
                player.bestHand = evaluation;
                player.handRank = evaluation.rank;
                
                console.log(`🃏 ${player.nickname}: ${evaluation.hand} (${evaluation.cards.map(c => c.display).join(' ')})`);
            }
        });
        
        return evaluations;
    }
    
    // Obtém cartas comunitárias
    getCommunityCards() {
        // Tenta obter do potManager ou cria array vazio
        if (this.potManager.communityCards) {
            return this.potManager.communityCards;
        }
        
        // Fallback: procura no deck usado
        const usedCards = this.deck.usedCards || [];
        const communityCards = usedCards.filter(card => card.faceUp);
        
        return communityCards.slice(0, 5); // Máximo 5 cartas comunitárias
    }
    
    // Determina vencedor(es)
    determineWinners(handEvaluations) {
        if (Object.keys(handEvaluations).length === 0) {
            return [];
        }
        
        // Ordena por força de mão
        const sortedPlayers = Object.entries(handEvaluations)
            .sort(([, evalA], [, evalB]) => {
                return this.handEvaluator.compareHands(evalB, evalA); // Descendente
            });
        
        // Pega melhor força
        const bestHandValue = sortedPlayers[0][1].value;
        
        // Filtra apenas jogadores com a melhor mão
        const winners = sortedPlayers
            .filter(([, evaluation]) => evaluation.value === bestHandValue)
            .map(([playerId]) => playerId);
        
        console.log(`🏆 Vencedor(es): ${winners.map(id => this.playerManager.getPlayerById(id)?.nickname).join(', ')}`);
        
        return winners;
    }
    
    // Distribui pote para vencedores
    distributePot(winners, handEvaluations = {}) {
        if (winners.length === 0) {
            console.warn('⚠️ Nenhum vencedor para distribuir pote');
            return;
        }
        
        this.state = GAME_STATES.DISTRIBUTING;
        
        console.log(`💰 Distribuindo pote para ${winners.length} vencedor(es)`);
        
        // Distribui através do potManager
        const distribution = this.potManager.distributeAllPots(winners, handEvaluations);
        
        // Atualiza fichas dos jogadores
        distribution.forEach(({ playerId, amount }) => {
            const player = this.playerManager.getPlayerById(playerId);
            if (player) {
                player.winChips(amount);
                
                // Atualiza estatísticas
                this.stats.totalPots += amount;
                if (amount > this.stats.biggestPot) {
                    this.stats.biggestPot = amount;
                }
            }
        });
        
        // Emite evento
        this.emit('pot_distributed', {
            winners: winners.map(id => ({
                playerId: id,
                nickname: this.playerManager.getPlayerById(id)?.nickname,
                amount: distribution.find(d => d.playerId === id)?.amount || 0
            })),
            totalDistributed: distribution.reduce((sum, d) => sum + d.amount, 0),
            handNumber: this.handNumber
        });
        
        // Finaliza mão
        this.finishHand();
    }
    
    // Finaliza mão atual
    finishHand() {
        console.log(`🏁 Finalizando mão #${this.handNumber}`);
        
        // Calcula duração da mão
        const handDuration = this.handStartTime ? 
            Math.floor((new Date() - this.handStartTime) / 1000) : 0;
        
        // Salva no histórico
        this.handHistory.push({
            handNumber: this.handNumber,
            duration: handDuration,
            potSize: this.potManager.totalAmount,
            winners: this.playerManager.getPlayersInHand()
                .filter(p => p.wonAmount > 0)
                .map(p => ({
                    playerId: p.userId,
                    nickname: p.nickname,
                    amount: p.wonAmount
                })),
            communityCards: this.getCommunityCards().map(c => c.display),
            timestamp: new Date().toISOString()
        });
        
        // Atualiza estatísticas
        this.stats.totalHands++;
        this.stats.averagePot = (
            (this.stats.averagePot * (this.stats.totalHands - 1)) + 
            this.potManager.totalAmount
        ) / this.stats.totalHands;
        
        // Verifica se jogo deve continuar
        if (this.shouldContinueGame()) {
            // Vai para estado entre mãos
            this.state = GAME_STATES.BETWEEN_HANDS;
            
            // Agenda próxima mão
            setTimeout(() => {
                if (this.state === GAME_STATES.BETWEEN_HANDS) {
                    this.startNewHand();
                }
            }, 3000); // 3 segundos entre mãos
            
            console.log(`⏳ Aguardando próxima mão...`);
            
        } else {
            // Finaliza jogo
            this.finishGame();
        }
    }
    
    // Verifica se jogo deve continuar
    shouldContinueGame() {
        const activePlayers = this.playerManager.getActivePlayers();
        
        // Se for cash game, sempre continua (a menos que não haja jogadores)
        if (this.gameType === 'cash') {
            return activePlayers.length >= this.minPlayers;
        }
        
        // Se for torneio, continua até ter um vencedor
        if (this.tournament) {
            return activePlayers.length > 1;
        }
        
        // Default: precisa de pelo menos 2 jogadores
        return activePlayers.length >= 2;
    }
    
    // ================ GERENCIAMENTO DE TEMPO ================
    
    // Inicia timer para ação atual
    startActionTimer() {
        this.stopActionTimer();
        
        if (!this.currentPlayerTurn) return;
        
        this.actionTimeRemaining = this.actionTime;
        
        this.actionTimer = setInterval(() => {
            this.actionTimeRemaining--;
            
            // Emite evento de tick
            this.emit('action_timer_tick', {
                playerId: this.currentPlayerTurn,
                timeRemaining: this.actionTimeRemaining,
                totalTime: this.actionTime
            });
            
            // Se tempo acabou, fold automático
            if (this.actionTimeRemaining <= 0) {
                this.handleActionTimeout();
            }
            
        }, 1000);
        
        console.log(`⏱️ Timer iniciado para ${this.currentPlayerTurn} (${this.actionTime}s)`);
    }
    
    // Para timer de ação
    stopActionTimer() {
        if (this.actionTimer) {
            clearInterval(this.actionTimer);
            this.actionTimer = null;
        }
    }
    
    // Trata timeout de ação
    handleActionTimeout() {
        const playerId = this.currentPlayerTurn;
        if (!playerId) return;
        
        console.log(`⏰ Timeout para ${playerId}`);
        
        try {
            // Fold automático
            this.processPlayerAction(playerId, ACTION_TYPES.FOLD);
            
            // Emite evento
            this.emit('action_timeout', {
                playerId: playerId,
                action: ACTION_TYPES.FOLD
            });
            
        } catch (error) {
            console.error('❌ Erro no timeout:', error);
        }
    }
    
    // ================ PAUSA/CONTINUAÇÃO ================
    
    // Pausa o jogo
    pauseGame() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.pauseStartTime = new Date();
        this.state = GAME_STATES.PAUSED;
        
        // Para timers
        this.stopActionTimer();
        
        console.log('⏸️ Jogo pausado');
        this.emit('game_paused', { timestamp: this.pauseStartTime });
    }
    
    // Retoma jogo pausado
    resumeGame() {
        if (!this.isPaused) return;
        
        const pauseEndTime = new Date();
        const pauseDuration = Math.floor((pauseEndTime - this.pauseStartTime) / 1000);
        
        this.totalPauseTime += pauseDuration;
        this.isPaused = false;
        this.pauseStartTime = null;
        
        // Retorna ao estado anterior
        this.state = this.currentRound.toUpperCase();
        
        // Reinicia timer se necessário
        if (this.currentPlayerTurn) {
            this.startActionTimer();
        }
        
        console.log(`▶️ Jogo retomado após ${pauseDuration}s`);
        this.emit('game_resumed', { 
            pauseDuration: pauseDuration,
            totalPauseTime: this.totalPauseTime 
        });
    }
    
    // ================ FINALIZAÇÃO ================
    
    // Finaliza o jogo completamente
    finishGame() {
        console.log('🏁 Finalizando jogo...');
        
        this.state = GAME_STATES.FINISHED;
        
        // Para todos os timers
        this.stopActionTimer();
        
        // Finaliza torneio se existir
        if (this.tournament) {
            this.tournament.finish();
        }
        
        // Calcula estatísticas finais
        this.calculateFinalStats();
        
        // Emite evento
        this.emit('game_finished', {
            gameId: this.gameId,
            handNumber: this.handNumber,
            totalDuration: this.getGameDuration(),
            winner: this.getWinner(),
            finalStats: this.stats
        });
        
        console.log(`🎮 Jogo ${this.name} finalizado após ${this.handNumber} mãos`);
    }
    
    // Verifica se jogo deve terminar
    checkIfGameShouldEnd() {
        const activePlayers = this.playerManager.getActivePlayers();
        
        if (activePlayers.length < this.minPlayers) {
            console.log(`⚠️ Muito poucos jogadores (${activePlayers.length}/${this.minPlayers})`);
            
            if (this.state !== GAME_STATES.LOBBY && 
                this.state !== GAME_STATES.FINISHED) {
                this.finishGame();
            }
        }
    }
    
    // Obtém vencedor do jogo
    getWinner() {
        const activePlayers = this.playerManager.getActivePlayers();
        
        if (activePlayers.length === 1) {
            return activePlayers[0];
        }
        
        // Para cash game, maior stack
        if (this.gameType === 'cash') {
            return activePlayers.reduce((max, p) => 
                p.chips > max.chips ? p : max, activePlayers[0]
            );
        }
        
        // Para torneio, usa ranking do torneio
        if (this.tournament && this.tournament.finalRankings.length > 0) {
            const winnerId = this.tournament.finalRankings[0].userId;
            return this.playerManager.getPlayerById(winnerId);
        }
        
        return null;
    }
    
    // Calcula duração do jogo
    getGameDuration() {
        // Implementação simplificada
        return this.totalPauseTime; // em segundos
    }
    
    // ================ ESTATÍSTICAS ================
    
    // Calcula estatísticas finais
    calculateFinalStats() {
        const players = this.playerManager.players;
        
        // Jogador mais ativo (mais ações)
        if (players.length > 0) {
            const mostActive = players.reduce((max, p) => 
                p.actionHistory.length > max.actionHistory.length ? p : max, players[0]
            );
            this.stats.mostActivePlayer = mostActive.userId;
        }
        
        // Mão mais rápida
        if (this.handHistory.length > 0) {
            const fastestHand = this.handHistory.reduce((min, h) => 
                h.duration < min.duration ? h : min, this.handHistory[0]
            );
            this.stats.fastestHand = fastestHand;
        }
    }
    
    // ================ COMUNICAÇÃO E EVENTOS ================
    
    // Registra listener para eventos
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }
    
    // Remove listener
    off(eventName, callback) {
        if (!this.eventListeners.has(eventName)) return;
        
        const listeners = this.eventListeners.get(eventName);
        const index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }
    
    // Emite evento para todos listeners
    emit(eventName, data = {}) {
        if (!this.broadcastEnabled) return;
        
        const listeners = this.eventListeners.get(eventName) || [];
        
        listeners.forEach(callback => {
            try {
                callback({
                    event: eventName,
                    timestamp: new Date().toISOString(),
                    gameId: this.gameId,
                    ...data
                });
            } catch (error) {
                console.error(`❌ Erro no listener de ${eventName}:`, error);
            }
        });
        
        // Também adiciona à fila para debug
        this.messageQueue.push({
            event: eventName,
            data: data,
            timestamp: new Date()
        });
        
        // Mantém fila limitada
        if (this.messageQueue.length > 1000) {
            this.messageQueue.shift();
        }
    }
    
    // Emite evento para jogador específico
    emitToPlayer(playerId, eventName, data = {}) {
        // Em produção, enviaria via WebSocket para jogador específico
        this.emit(eventName, { ...data, targetPlayer: playerId });
    }
    
    // Log de erros
    logError(context, error, extraData = {}) {
        const errorEntry = {
            context: context,
            error: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            gameState: this.getGameState(),
            ...extraData
        };
        
        this.errorLog.push(errorEntry);
        
        // Mantém log limitado
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }
        
        console.error(`❌ [${context}]`, error);
    }
    
    // ================ ESTADO DO JOGO ================
    
    // Obtém estado completo do jogo
    getGameState() {
        const players = this.playerManager.players.map(p => p.toJSON());
        const activePlayers = this.playerManager.getActivePlayers();
        const playersInHand = this.playerManager.getPlayersInHand();
        
        return {
            // Informações básicas
            gameId: this.gameId,
            name: this.name,
            gameType: this.gameType,
            state: this.state,
            currentRound: this.currentRound,
            handNumber: this.handNumber,
            
            // Posições
            dealerPosition: this.dealerPosition,
            smallBlindPosition: this.smallBlindPosition,
            bigBlindPosition: this.bigBlindPosition,
            currentPlayerTurn: this.currentPlayerTurn,
            
            // Apostas
            currentMaxBet: this.currentMaxBet,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            ante: this.ante,
            
            // Pote
            potTotal: this.potManager.totalAmount,
            potInfo: this.potManager.getDisplayInfo(),
            
            // Jogadores
            players: players,
            playerCount: players.length,
            activePlayers: activePlayers.length,
            playersInHand: playersInHand.length,
            
            // Cartas comunitárias
            communityCards: this.getCommunityCards().map(c => c.display),
            
            // Timer
            actionTimeRemaining: this.actionTimeRemaining,
            actionTime: this.actionTime,
            
            // Controle
            isPaused: this.isPaused,
            canStartNewHand: this.canStartNewHand(),
            
            // Estatísticas
            stats: {
                ...this.stats,
                averagePot: Math.round(this.stats.averagePot)
            },
            
            // Configurações
            settings: this.settings
        };
    }
    
    // Reseta estado completo do jogo
    resetGameState() {
        this.state = GAME_STATES.LOBBY;
        this.handNumber = 0;
        this.dealerPosition = 0;
        this.currentPlayerTurn = null;
        this.currentMaxBet = 0;
        this.lastAction = null;
        this.actionTimeRemaining = this.actionTime;
        
        // Reseta módulos
        if (this.deck) this.deck.reset();
        if (this.playerManager) this.playerManager = new PlayerManager(this.maxPlayers);
        if (this.potManager) this.potManager.resetForNewHand();
        
        console.log('🔄 Estado do jogo resetado');
    }
    
    // ================ UTILIDADES ================
    
    // Obtém informações para display
    getDisplayInfo() {
        return {
            gameId: this.gameId,
            name: this.name,
            gameType: this.gameType,
            state: this.state,
            handNumber: this.handNumber,
            playerCount: this.playerManager.players.length,
            maxPlayers: this.maxPlayers,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            ante: this.ante,
            potTotal: this.potManager.totalAmount,
            currentPlayerTurn: this.currentPlayerTurn ? 
                this.playerManager.getPlayerById(this.currentPlayerTurn)?.nickname : null,
            communityCards: this.getCommunityCards().map(c => c.display),
            canStart: this.canStartNewHand(),
            isPaused: this.isPaused
        };
    }
    
    // Verifica integridade do jogo
    validateGameIntegrity() {
        const issues = [];
        
        // Verifica consistência de fichas
        const totalChips = this.playerManager.players.reduce((sum, p) => sum + p.chips, 0);
        const expectedChips = this.playerManager.players.length * this.startingStack;
        
        if (totalChips !== expectedChips) {
            issues.push(`Inconsistência de fichas: ${totalChips} vs ${expectedChips}`);
        }
        
        // Verifica jogadores duplicados
        const playerIds = new Set();
        this.playerManager.players.forEach(p => {
            if (playerIds.has(p.userId)) {
                issues.push(`Jogador duplicado: ${p.userId}`);
            }
            playerIds.add(p.userId);
        });
        
        // Verifica estado válido
        if (!Object.values(GAME_STATES).includes(this.state)) {
            issues.push(`Estado inválido: ${this.state}`);
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            playerCount: this.playerManager.players.length,
            totalChips: totalChips,
            expectedChips: expectedChips
        };
    }
    
    // Serializa estado para salvar
    toJSON() {
        return {
            // Configuração
            gameId: this.gameId,
            name: this.name,
            gameType: this.gameType,
            maxPlayers: this.maxPlayers,
            minPlayers: this.minPlayers,
            startingStack: this.startingStack,
            smallBlind: this.smallBlind,
            bigBlind: this.bigBlind,
            ante: this.ante,
            actionTime: this.actionTime,
            isPrivate: this.isPrivate,
            
            // Estado atual
            state: this.state,
            currentRound: this.currentRound,
            handNumber: this.handNumber,
            dealerPosition: this.dealerPosition,
            smallBlindPosition: this.smallBlindPosition,
            bigBlindPosition: this.bigBlindPosition,
            currentPlayerTurn: this.currentPlayerTurn,
            currentMaxBet: this.currentMaxBet,
            lastRaiseAmount: this.lastRaiseAmount,
            lastAction: this.lastAction,
            
            // Módulos
            deck: this.deck?.toJSON(),
            playerManager: this.playerManager?.toJSON(),
            potManager: this.potManager?.toJSON(),
            tournament: this.tournament?.toJSON(),
            
            // Controle
            handStartTime: this.handStartTime?.toISOString(),
            roundStartTime: this.roundStartTime?.toISOString(),
            actionTimeRemaining: this.actionTimeRemaining,
            isPaused: this.isPaused,
            pauseStartTime: this.pauseStartTime?.toISOString(),
            totalPauseTime: this.totalPauseTime,
            
            // Estatísticas
            stats: this.stats,
            
            // Histórico
            handHistory: this.handHistory.slice(-50),
            actionHistory: this.actionHistory.slice(-100),
            errorLog: this.errorLog.slice(-20),
            
            // Configurações
            settings: this.settings,
            
            // Metadados
            version: '1.0.0',
            savedAt: new Date().toISOString()
        };
    }
    
    // Restaura de JSON
    static fromJSON(jsonData) {
        const config = {
            gameId: jsonData.gameId,
            name: jsonData.name,
            gameType: jsonData.gameType,
            maxPlayers: jsonData.maxPlayers,
            minPlayers: jsonData.minPlayers,
            startingStack: jsonData.startingStack,
            smallBlind: jsonData.smallBlind,
            bigBlind: jsonData.bigBlind,
            ante: jsonData.ante,
            actionTime: jsonData.actionTime,
            isPrivate: jsonData.isPrivate
        };
        
        const manager = new PokerGameManager(config);
        
        // Restaura estado
        manager.state = jsonData.state;
        manager.currentRound = jsonData.currentRound;
        manager.handNumber = jsonData.handNumber;
        manager.dealerPosition = jsonData.dealerPosition;
        manager.smallBlindPosition = jsonData.smallBlindPosition;
        manager.bigBlindPosition = jsonData.bigBlindPosition;
        manager.currentPlayerTurn = jsonData.currentPlayerTurn;
        manager.currentMaxBet = jsonData.currentMaxBet;
        manager.lastRaiseAmount = jsonData.lastRaiseAmount;
        manager.lastAction = jsonData.lastAction;
        
        // Restaura módulos
        if (jsonData.deck) {
            manager.deck = PokerDeck.fromJSON(jsonData.deck);
        }
        
        if (jsonData.playerManager) {
            manager.playerManager = PlayerManager.fromJSON(jsonData.playerManager, PokerCard);
        }
        
        if (jsonData.potManager) {
            manager.potManager = PotManager.fromJSON(jsonData.potManager);
        }
        
        if (jsonData.tournament) {
            manager.tournament = PokerTournament.fromJSON(jsonData.tournament);
        }
        
        // Restaura controle
        if (jsonData.handStartTime) {
            manager.handStartTime = new Date(jsonData.handStartTime);
        }
        if (jsonData.roundStartTime) {
            manager.roundStartTime = new Date(jsonData.roundStartTime);
        }
        manager.actionTimeRemaining = jsonData.actionTimeRemaining;
        manager.isPaused = jsonData.isPaused;
        if (jsonData.pauseStartTime) {
            manager.pauseStartTime = new Date(jsonData.pauseStartTime);
        }
        manager.totalPauseTime = jsonData.totalPauseTime;
        
        // Restaura dados
        manager.stats = jsonData.stats || {};
        manager.handHistory = jsonData.handHistory || [];
        manager.actionHistory = jsonData.actionHistory || [];
        manager.errorLog = jsonData.errorLog || [];
        manager.settings = jsonData.settings || {};
        
        // Marca como inicializado
        manager.initialized = true;
        
        return manager;
    }
}

// ================ FUNÇÕES DE UTILIDADE ================

// Cria nova instância de jogo
export function createPokerGame(config = {}) {
    return new PokerGameManager(config);
}

// Valida configuração do jogo
export function validateGameConfig(config) {
    const errors = [];
    
    if (!config.name || config.name.trim().length < 2) {
        errors.push('Nome do jogo deve ter pelo menos 2 caracteres');
    }
    
    if (config.maxPlayers < 2 || config.maxPlayers > 10) {
        errors.push('Número máximo de jogadores deve estar entre 2 e 10');
    }
    
    if (config.minPlayers < 2 || config.minPlayers > config.maxPlayers) {
        errors.push('Número mínimo de jogadores inválido');
    }
    
    if (config.startingStack < 100 || config.startingStack > 100000) {
        errors.push('Stack inicial deve estar entre 100 e 100.000');
    }
    
    if (config.smallBlind <= 0 || config.bigBlind <= config.smallBlind) {
        errors.push('Blinds inválidos: big blind deve ser maior que small blind');
    }
    
    if (config.actionTime < 10 || config.actionTime > 120) {
        errors.push('Tempo de ação deve estar entre 10 e 120 segundos');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Simula jogo rápido para testes
export async function simulateQuickGame() {
    console.log('🎮 Simulando jogo rápido...');
    
    const game = createPokerGame({
        name: 'Test Game',
        maxPlayers: 4,
        minPlayers: 2,
        startingStack: 1000,
        smallBlind: 10,
        bigBlind: 20
    });
    
    await game.initialize();
    
    // Adiciona jogadores
    game.addPlayer('player1', 'Alice');
    game.addPlayer('player2', 'Bob', 1000, true);
    game.addPlayer('player3', 'Charlie', 1000, true);
    
    // Inicia jogo
    game.startNewHand();
    
    return game;
}

// Exporta tudo
export default {
    // Constantes
    GAME_STATES,
    ACTION_TYPES,
    
    // Classe principal
    PokerGameManager,
    
    // Funções
    createPokerGame,
    validateGameConfig,
    simulateQuickGame
};