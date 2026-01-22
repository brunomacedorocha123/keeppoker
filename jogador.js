/**
 * SISTEMA COMPLETO DE JOGADORES PARA POKER
 * Arquivo: jogador.js
 * Responsável por: Gerenciamento de jogadores, ações, fichas, posições
 */

// ================ CLASSE JOGADOR INDIVIDUAL ================
export class PokerPlayer {
    constructor(userId, nickname, chips = 1500, position = 0, isBot = false) {
        if (!userId) throw new Error('ID do jogador é obrigatório');
        
        // Identificação
        this.userId = userId;
        this.nickname = nickname || `Jogador_${userId.slice(-4)}`;
        this.isBot = isBot;
        this.avatar = this.generateAvatar();
        
        // Fichas e apostas
        this.chips = Math.max(0, chips);
        this.startingChips = this.chips;
        this.bet = 0;                    // Aposta na rodada atual
        this.totalBetThisHand = 0;       // Aposta total na mão
        this.lastBetAmount = 0;          // Último valor apostado
        
        // Cartas
        this.cards = [];
        this.bestHand = null;            // Melhor mão avaliada
        this.handRank = 0;               // Rank da mão (1-10)
        
        // Status do jogo
        this.position = position;        // Posição na mesa (0-8)
        this.isActive = true;            // Está no torneio?
        this.isInHand = true;            // Está na mão atual?
        this.isFolded = false;           // Desistiu?
        this.isAllIn = false;            // Está all-in?
        this.hasActedThisRound = false;  // Já agiu nesta rodada?
        this.sittingOut = false;         // Está ausente?
        this.isEliminated = false;       // Foi eliminado?
        
        // Posições especiais
        this.isDealer = false;
        this.isSmallBlind = false;
        this.isBigBlind = false;
        this.isCurrentTurn = false;
        
        // Ações e histórico
        this.lastAction = null;          // Última ação (fold, check, etc)
        this.lastActionAmount = 0;
        this.actionHistory = [];         // Histórico completo
        this.timeBank = 30;              // Tempo para agir (segundos)
        this.timeRemaining = 30;
        
        // Conexão
        this.connected = true;
        this.lastSeen = new Date();
        this.ping = 0;
        
        // Vitórias
        this.isWinner = false;
        this.wonAmount = 0;
        this.potWon = 0;
        
        // Estatísticas
        this.stats = {
            handsPlayed: 0,
            handsWon: 0,
            totalProfit: 0,
            biggestPotWon: 0,
            biggestWin: 0,
            biggestLoss: 0,
            vpip: 0,          // Voluntary Put $ In Pot (%)
            pfr: 0,           // Pre-Flop Raise (%)
            aggressionFactor: 0,
            folds: 0,
            checks: 0,
            calls: 0,
            bets: 0,
            raises: 0,
            allins: 0,
            showDowns: 0,
            showDownWins: 0
        };
        
        // Bot behavior (se for bot)
        if (isBot) {
            this.botPersonality = this.generateBotPersonality();
            this.botDifficulty = 'medium'; // easy, medium, hard
        }
    }
    
    // ================ MÉTODOS DE STATUS ================
    
    // Reseta para nova mão
    resetForNewHand() {
        this.cards = [];
        this.bestHand = null;
        this.handRank = 0;
        this.bet = 0;
        this.totalBetThisHand = 0;
        this.lastBetAmount = 0;
        this.lastAction = null;
        this.lastActionAmount = 0;
        this.isFolded = false;
        this.isAllIn = false;
        this.hasActedThisRound = false;
        this.isCurrentTurn = false;
        this.isWinner = false;
        this.wonAmount = 0;
        this.potWon = 0;
        this.isInHand = true;
        
        // Se não tem fichas, está eliminado
        if (this.chips <= 0) {
            this.isEliminated = true;
            this.isActive = false;
            this.isInHand = false;
        }
        
        return this;
    }
    
    // Distribui cartas para o jogador
    dealCards(cards) {
        if (!cards || !Array.isArray(cards)) {
            throw new Error('Cards deve ser um array');
        }
        if (cards.length !== 2) {
            throw new Error('Deve receber exatamente 2 cartas');
        }
        
        this.cards = cards;
        this.stats.handsPlayed++;
        
        console.log(`🃏 ${this.nickname} recebeu: ${cards.map(c => c.display).join(' ')}`);
        return this;
    }
    
    // ================ MÉTODOS DE AÇÃO ================
    
    // Executa uma ação do jogador
    takeAction(action, amount = 0, gameState = {}) {
        if (!this.canAct(gameState)) {
            throw new Error(`${this.nickname} não pode agir no momento`);
        }
        
        const actionLower = action.toLowerCase();
        this.lastAction = actionLower;
        this.lastActionAmount = amount;
        this.hasActedThisRound = true;
        this.isCurrentTurn = false;
        
        let chipsAdded = 0;
        let actionResult = { action: actionLower, amount: 0, success: true };
        
        switch(actionLower) {
            case 'fold':
                this.fold();
                break;
                
            case 'check':
                chipsAdded = this.check(gameState.currentMaxBet);
                break;
                
            case 'call':
                chipsAdded = this.call(gameState.currentMaxBet);
                break;
                
            case 'bet':
                chipsAdded = this.bet(amount, gameState.currentMaxBet);
                break;
                
            case 'raise':
                chipsAdded = this.raise(amount, gameState.currentMaxBet);
                break;
                
            case 'allin':
                chipsAdded = this.allIn();
                break;
                
            default:
                throw new Error(`Ação inválida: ${action}`);
        }
        
        // Atualiza histórico
        this.actionHistory.push({
            action: actionLower,
            amount: chipsAdded,
            round: gameState.currentRound,
            timestamp: new Date().toISOString(),
            position: this.position,
            chipsBefore: this.chips + chipsAdded,
            chipsAfter: this.chips
        });
        
        // Atualiza estatísticas
        this.updateStats(actionLower, chipsAdded);
        
        actionResult.amount = chipsAdded;
        console.log(`🎯 ${this.nickname} ${actionLower}${chipsAdded > 0 ? ' ' + chipsAdded : ''}`);
        
        return actionResult;
    }
    
    // Ação: Fold
    fold() {
        this.isFolded = true;
        this.isInHand = false;
        this.bet = 0;
        this.stats.folds++;
        return 0;
    }
    
    // Ação: Check
    check(currentMaxBet) {
        if (!this.canCheck(currentMaxBet)) {
            throw new Error('Não pode dar check, precisa igualar a aposta');
        }
        this.stats.checks++;
        return 0;
    }
    
    // Ação: Call
    call(currentMaxBet) {
        const callAmount = this.getCallAmount(currentMaxBet);
        if (callAmount <= 0) {
            // Se não precisa pagar nada, é um check
            return this.check(currentMaxBet);
        }
        
        const chipsAdded = this.addToBet(callAmount);
        this.stats.calls++;
        return chipsAdded;
    }
    
    // Ação: Bet
    bet(amount, currentMaxBet) {
        if (currentMaxBet > 0) {
            throw new Error('Não pode fazer bet quando já há apostas (use raise)');
        }
        if (amount <= 0) {
            throw new Error('Valor de bet inválido');
        }
        
        const chipsAdded = this.addToBet(amount);
        this.stats.bets++;
        return chipsAdded;
    }
    
    // Ação: Raise
    raise(amount, currentMaxBet) {
        const minRaise = this.getMinRaise(currentMaxBet);
        
        if (amount < minRaise && this.chips >= minRaise) {
            throw new Error(`Raise mínimo: ${minRaise} (atual: ${amount})`);
        }
        
        const chipsAdded = this.addToBet(amount);
        this.stats.raises++;
        return chipsAdded;
    }
    
    // Ação: All-in
    allIn() {
        const chipsAdded = this.addToBet(this.chips);
        this.isAllIn = true;
        this.stats.allins++;
        return chipsAdded;
    }
    
    // ================ MÉTODOS DE APOSTA ================
    
    // Adiciona fichas à aposta
    addToBet(amount) {
        if (amount <= 0) return 0;
        
        const actualAmount = Math.min(amount, this.chips);
        
        if (actualAmount <= 0) {
            console.warn(`${this.nickname} tentou apostar sem fichas`);
            return 0;
        }
        
        this.chips -= actualAmount;
        this.bet += actualAmount;
        this.totalBetThisHand += actualAmount;
        this.lastBetAmount = actualAmount;
        
        if (this.chips === 0) {
            this.isAllIn = true;
            console.log(`💎 ${this.nickname} está ALL-IN!`);
        }
        
        return actualAmount;
    }
    
    // Retorna fichas ao jogador (caso de erro ou cancelamento)
    refundBet(amount) {
        const refundAmount = Math.min(amount, this.bet);
        this.chips += refundAmount;
        this.bet -= refundAmount;
        this.totalBetThisHand -= refundAmount;
        return refundAmount;
    }
    
    // Recebe fichas do pote
    winChips(amount, potSize = 0) {
        this.chips += amount;
        this.wonAmount = amount;
        this.potWon = potSize;
        this.isWinner = true;
        this.stats.totalProfit += amount;
        this.stats.handsWon++;
        
        if (amount > this.stats.biggestWin) {
            this.stats.biggestWin = amount;
        }
        
        if (potSize > this.stats.biggestPotWon) {
            this.stats.biggestPotWon = potSize;
        }
        
        console.log(`💰 ${this.nickname} ganhou ${amount} fichas`);
        return amount;
    }
    
    // ================ MÉTODOS DE VERIFICAÇÃO ================
    
    // Verifica se pode agir
    canAct(gameState = {}) {
        if (!this.isActive) return false;
        if (this.isEliminated) return false;
        if (!this.isInHand) return false;
        if (this.isFolded) return false;
        if (this.isAllIn) return false;
        if (this.sittingOut) return false;
        if (!this.connected) return false;
        if (this.chips <= 0) return false;
        
        // Se está no turno atual
        if (gameState.currentPlayerTurn === this.userId) {
            return true;
        }
        
        return false;
    }
    
    // Verifica se pode dar check
    canCheck(currentMaxBet) {
        return this.bet >= currentMaxBet;
    }
    
    // Calcula valor necessário para call
    getCallAmount(currentMaxBet) {
        return Math.max(0, currentMaxBet - this.bet);
    }
    
    // Calcula raise mínimo
    getMinRaise(currentMaxBet) {
        if (currentMaxBet === 0) return 0; // Pode fazer bet de qualquer valor
        
        const difference = currentMaxBet - this.bet;
        return Math.max(currentMaxBet + difference, currentMaxBet * 2);
    }
    
    // Verifica se pode fazer raise
    canRaise(currentMaxBet) {
        if (this.isAllIn) return false;
        if (this.chips <= 0) return false;
        
        const minRaise = this.getMinRaise(currentMaxBet);
        const callAmount = this.getCallAmount(currentMaxBet);
        
        return this.chips > callAmount && this.chips >= minRaise;
    }
    
    // ================ MÉTODOS DE ESTATÍSTICAS ================
    
    // Atualiza estatísticas baseadas na ação
    updateStats(action, chipsAdded = 0) {
        // Atualiza VPIP (Voluntary Put $ In Pot)
        if (['bet', 'raise', 'call', 'allin'].includes(action) && chipsAdded > 0) {
            this.stats.vpip = ((this.stats.handsPlayed * this.stats.vpip) + 1) / 
                             (this.stats.handsPlayed + 1);
        }
        
        // Atualiza PFR (Pre-Flop Raise)
        if (action === 'raise' && chipsAdded > 0) {
            this.stats.pfr = ((this.stats.handsPlayed * this.stats.pfr) + 1) / 
                            (this.stats.handsPlayed + 1);
        }
        
        // Atualiza Aggression Factor
        const aggressiveActions = ['bet', 'raise', 'allin'].filter(a => a === action).length;
        const passiveActions = ['check', 'call', 'fold'].filter(a => a === action).length;
        
        if (passiveActions > 0) {
            this.stats.aggressionFactor = aggressiveActions / passiveActions;
        }
    }
    
    // Calcula ROI (Return on Investment)
    getROI() {
        if (this.stats.handsPlayed === 0) return 0;
        return (this.stats.totalProfit / (this.stats.handsPlayed * this.startingChips)) * 100;
    }
    
    // Calcula Win Rate
    getWinRate() {
        if (this.stats.handsPlayed === 0) return 0;
        return (this.stats.handsWon / this.stats.handsPlayed) * 100;
    }
    
    // ================ MÉTODOS DE BOT ================
    
    // Gera personalidade aleatória para bot
    generateBotPersonality() {
        const personalities = ['tight', 'loose', 'aggressive', 'passive', 'balanced'];
        const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
        
        return {
            type: randomPersonality,
            bluffFrequency: Math.random() * 0.3, // 0-30%
            callFrequency: 0.5 + Math.random() * 0.3, // 50-80%
            raiseFrequency: 0.1 + Math.random() * 0.2, // 10-30%
            patience: Math.random() * 0.8 + 0.2, // 20-100%
            riskTolerance: Math.random() // 0-100%
        };
    }
    
    // Gera avatar baseado no nome
    generateAvatar() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
            '#118AB2', '#EF476F', '#7209B7', '#F3722C'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const initial = this.nickname.charAt(0).toUpperCase();
        
        return {
            color: color,
            initial: initial,
            emoji: this.getRandomEmoji()
        };
    }
    
    getRandomEmoji() {
        const emojis = ['😎', '🤠', '😏', '🧐', '😈', '🤖', '👑', '💎'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    // ================ MÉTODOS DE SERIALIZAÇÃO ================
    
    // Converte para objeto simples (para Firestore/JSON)
    toJSON() {
        return {
            // Identificação
            userId: this.userId,
            nickname: this.nickname,
            isBot: this.isBot,
            avatar: this.avatar,
            
            // Fichas
            chips: this.chips,
            startingChips: this.startingChips,
            bet: this.bet,
            totalBetThisHand: this.totalBetThisHand,
            lastBetAmount: this.lastBetAmount,
            
            // Cartas
            cards: this.cards.map(card => card?.toJSON?.() || card),
            bestHand: this.bestHand,
            handRank: this.handRank,
            
            // Status
            position: this.position,
            isActive: this.isActive,
            isInHand: this.isInHand,
            isFolded: this.isFolded,
            isAllIn: this.isAllIn,
            hasActedThisRound: this.hasActedThisRound,
            sittingOut: this.sittingOut,
            isEliminated: this.isEliminated,
            
            // Posições especiais
            isDealer: this.isDealer,
            isSmallBlind: this.isSmallBlind,
            isBigBlind: this.isBigBlind,
            isCurrentTurn: this.isCurrentTurn,
            
            // Ações
            lastAction: this.lastAction,
            lastActionAmount: this.lastActionAmount,
            actionHistory: this.actionHistory.slice(-10), // Últimas 10 ações
            timeRemaining: this.timeRemaining,
            
            // Conexão
            connected: this.connected,
            lastSeen: this.lastSeen.toISOString(),
            ping: this.ping,
            
            // Vitória
            isWinner: this.isWinner,
            wonAmount: this.wonAmount,
            potWon: this.potWon,
            
            // Estatísticas
            stats: this.stats,
            
            // Bot
            botPersonality: this.botPersonality,
            botDifficulty: this.botDifficulty
        };
    }
    
    // Restaura de JSON
    static fromJSON(jsonData, CardClass) {
        const player = new PokerPlayer(
            jsonData.userId,
            jsonData.nickname,
            jsonData.chips,
            jsonData.position,
            jsonData.isBot
        );
        
        // Restaura propriedades
        Object.keys(jsonData).forEach(key => {
            if (key !== 'cards') {
                player[key] = jsonData[key];
            }
        });
        
        // Restaura cartas
        if (jsonData.cards && CardClass) {
            player.cards = jsonData.cards.map(cardData => {
                if (typeof cardData === 'string') {
                    return CardClass.fromString(cardData);
                } else if (cardData.suit && cardData.rank) {
                    return new CardClass(cardData.suit, cardData.rank);
                }
                return cardData;
            });
        }
        
        // Converte datas
        if (jsonData.lastSeen) {
            player.lastSeen = new Date(jsonData.lastSeen);
        }
        
        return player;
    }
    
    // ================ GETTERS ÚTEIS ================
    
    get isPlaying() {
        return this.isActive && this.isInHand && !this.isFolded && !this.sittingOut;
    }
    
    get canReceiveCards() {
        return this.isActive && this.isInHand && this.chips > 0;
    }
    
    get stackSize() {
        return this.chips;
    }
    
    get isShortStack() {
        return this.chips < 20; // Menos de 20 big blinds
    }
    
    get profit() {
        return this.chips - this.startingChips;
    }
    
    // Formata informações para display
    getDisplayInfo(showCards = false) {
        return {
            name: this.nickname,
            chips: this.chips,
            bet: this.bet,
            position: this.position,
            status: this.getStatusText(),
            cards: showCards ? this.cards.map(c => c.display) : ['?', '?'],
            isTurn: this.isCurrentTurn,
            isDealer: this.isDealer,
            isSmallBlind: this.isSmallBlind,
            isBigBlind: this.isBigBlind,
            lastAction: this.lastAction,
            timeRemaining: this.timeRemaining
        };
    }
    
    getStatusText() {
        if (this.isEliminated) return 'Eliminado';
        if (this.sittingOut) return 'Ausente';
        if (this.isFolded) return 'Desistiu';
        if (this.isAllIn) return 'All-in';
        if (!this.connected) return 'Desconectado';
        if (this.isCurrentTurn) return 'Sua vez';
        return 'Aguardando';
    }
    
    // ================ MÉTODOS DE TEMPO ================
    
    startTurnTimer(seconds = 30) {
        this.timeRemaining = seconds;
        this.isCurrentTurn = true;
        
        console.log(`⏱️ ${this.nickname} tem ${seconds}s para agir`);
        
        return {
            startTime: new Date(),
            duration: seconds,
            playerId: this.userId
        };
    }
    
    stopTurnTimer() {
        this.timeRemaining = 0;
        this.isCurrentTurn = false;
    }
    
    updateTimer() {
        if (this.isCurrentTurn && this.timeRemaining > 0) {
            this.timeRemaining--;
            
            if (this.timeRemaining <= 5) {
                console.warn(`⚠️ ${this.nickname} tem apenas ${this.timeRemaining}s restantes!`);
            }
            
            return this.timeRemaining;
        }
        return 0;
    }
    
    // ================ UTILIDADES ================
    
    // Senta fora
    sitOut() {
        this.sittingOut = true;
        this.isInHand = false;
        console.log(`💺 ${this.nickname} sentou fora`);
    }
    
    // Retorna ao jogo
    sitIn() {
        this.sittingOut = false;
        this.isInHand = true;
        console.log(`🎮 ${this.nickname} retornou ao jogo`);
    }
    
    // Elimina jogador
    eliminate() {
        this.isEliminated = true;
        this.isActive = false;
        this.isInHand = false;
        this.chips = 0;
        console.log(`☠️ ${this.nickname} foi eliminado`);
    }
    
    // Reconecta jogador
    reconnect() {
        this.connected = true;
        this.lastSeen = new Date();
        console.log(`🔌 ${this.nickname} reconectou`);
    }
    
    // Desconecta jogador
    disconnect() {
        this.connected = false;
        this.lastSeen = new Date();
        console.log(`📴 ${this.nickname} desconectou`);
    }
}

// ================ CLASSE GERENCIADOR DE JOGADORES ================
export class PlayerManager {
    constructor(maxPlayers = 9) {
        this.maxPlayers = maxPlayers;
        this.players = []; // Array de PokerPlayer
        this.seats = Array(maxPlayers).fill(null); // Estado das cadeiras
        this.playerMap = new Map(); // userId -> PokerPlayer
        this.activeCount = 0;
        this.eliminatedCount = 0;
        this.connectedCount = 0;
    }
    
    // ================ MÉTODOS DE ADIÇÃO/REMÇÃO ================
    
    // Adiciona jogador à mesa
    addPlayer(userId, nickname, chips = 1500, isBot = false) {
        // Verifica limites
        if (this.players.length >= this.maxPlayers) {
            throw new Error(`Mesa cheia (max: ${this.maxPlayers})`);
        }
        
        // Verifica duplicado
        if (this.getPlayerById(userId)) {
            throw new Error('Jogador já está na mesa');
        }
        
        // Encontra assento disponível
        const position = this.findAvailableSeat();
        if (position === -1) {
            throw new Error('Nenhum assento disponível');
        }
        
        // Cria jogador
        const player = new PokerPlayer(userId, nickname, chips, position, isBot);
        
        // Adiciona às estruturas
        this.players.push(player);
        this.playerMap.set(userId, player);
        this.seats[position] = userId;
        this.activeCount++;
        this.connectedCount++;
        
        console.log(`👤 ${nickname} entrou na posição ${position} com ${chips} fichas`);
        
        return player;
    }
    
    // Remove jogador da mesa
    removePlayer(userId) {
        const player = this.getPlayerById(userId);
        if (!player) return false;
        
        // Remove das estruturas
        const index = this.players.findIndex(p => p.userId === userId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
        
        this.playerMap.delete(userId);
        this.seats[player.position] = null;
        
        // Atualiza contadores
        if (player.isActive) this.activeCount--;
        if (player.connected) this.connectedCount--;
        if (player.isEliminated) this.eliminatedCount--;
        
        console.log(`🚪 ${player.nickname} saiu da mesa`);
        return true;
    }
    
    // ================ MÉTODOS DE BUSCA ================
    
    // Busca jogador por ID
    getPlayerById(userId) {
        return this.playerMap.get(userId);
    }
    
    // Busca jogador por posição
    getPlayerByPosition(position) {
        const userId = this.seats[position];
        return userId ? this.getPlayerById(userId) : null;
    }
    
    // Busca jogador pelo nickname
    getPlayerByNickname(nickname) {
        return this.players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
    }
    
    // ================ MÉTODOS DE FILTRO ================
    
    // Jogadores ativos (não eliminados, não ausentes)
    getActivePlayers() {
        return this.players.filter(p => p.isActive && !p.sittingOut && p.chips > 0);
    }
    
    // Jogadores na mão atual (não foldaram, não estão all-in)
    getPlayersInHand() {
        return this.players.filter(p => p.isInHand && !p.isFolded);
    }
    
    // Jogadores que podem receber cartas
    getPlayersEligibleForCards() {
        return this.players.filter(p => p.canReceiveCards);
    }
    
    // Jogadores conectados
    getConnectedPlayers() {
        return this.players.filter(p => p.connected);
    }
    
    // Jogadores que estão no turno atual (podem agir)
    getPlayersWhoCanAct(gameState) {
        return this.players.filter(p => p.canAct(gameState));
    }
    
    // Jogadores all-in
    getAllInPlayers() {
        return this.players.filter(p => p.isAllIn);
    }
    
    // ================ MÉTODOS DE POSIÇÃO ================
    
    // Encontra assento disponível
    findAvailableSeat() {
        for (let i = 0; i < this.seats.length; i++) {
            if (this.seats[i] === null) {
                return i;
            }
        }
        return -1;
    }
    
    // Muda jogador de posição
    changePlayerPosition(userId, newPosition) {
        if (newPosition < 0 || newPosition >= this.maxPlayers) {
            throw new Error('Posição inválida');
        }
        
        if (this.seats[newPosition] !== null) {
            throw new Error('Posição já ocupada');
        }
        
        const player = this.getPlayerById(userId);
        if (!player) return false;
        
        // Libera posição antiga
        this.seats[player.position] = null;
        
        // Ocupa nova posição
        player.position = newPosition;
        this.seats[newPosition] = userId;
        
        console.log(`🔄 ${player.nickname} mudou para posição ${newPosition}`);
        return true;
    }
    
    // Reorganiza posições após eliminação
    compactSeats() {
        const activePlayers = this.getActivePlayers();
        
        // Ordena por posição atual
        activePlayers.sort((a, b) => a.position - b.position);
        
        // Redistribui posições
        this.seats.fill(null);
        activePlayers.forEach((player, index) => {
            player.position = index;
            this.seats[index] = player.userId;
        });
        
        console.log(`📦 Assentos compactados: ${activePlayers.length} jogadores ativos`);
    }
    
    // ================ MÉTODOS DE GERENCIAMENTO DE MÃO ================
    
    // Reseta todos jogadores para nova mão
    resetAllForNewHand() {
        this.players.forEach(player => {
            player.resetForNewHand();
        });
        
        console.log(`🔄 Todos os jogadores resetados para nova mão`);
    }
    
    // Distribui posições especiais (dealer, blinds)
    assignSpecialPositions(dealerPosition, smallBlind, bigBlind) {
        this.players.forEach(player => {
            player.isDealer = (player.position === dealerPosition);
            player.isSmallBlind = (player.position === smallBlind);
            player.isBigBlind = (player.position === bigBlind);
        });
        
        const dealer = this.getPlayerByPosition(dealerPosition);
        const sb = this.getPlayerByPosition(smallBlind);
        const bb = this.getPlayerByPosition(bigBlind);
        
        console.log(`👑 Dealer: ${dealer?.nickname}, SB: ${sb?.nickname}, BB: ${bb?.nickname}`);
    }
    
    // Obtém ordem dos jogadores (sentido horário a partir de uma posição)
    getPlayerOrder(startPosition = 0) {
        const activePlayers = this.getActivePlayers();
        
        return [...activePlayers].sort((a, b) => {
            // Calcula distância relativa à posição inicial
            let aDist = (a.position - startPosition + this.maxPlayers) % this.maxPlayers;
            let bDist = (b.position - startPosition + this.maxPlayers) % this.maxPlayers;
            
            // Ordena pela distância (mais próximo primeiro)
            return aDist - bDist;
        });
    }
    
    // ================ MÉTODOS DE ESTATÍSTICAS ================
    
    // Estatísticas gerais da mesa
    getTableStats() {
        const activePlayers = this.getActivePlayers();
        const inHandPlayers = this.getPlayersInHand();
        const connectedPlayers = this.getConnectedPlayers();
        
        return {
            totalPlayers: this.players.length,
            activePlayers: activePlayers.length,
            inHandPlayers: inHandPlayers.length,
            connectedPlayers: connectedPlayers.length,
            eliminatedPlayers: this.eliminatedCount,
            availableSeats: this.maxPlayers - this.players.length,
            averageStack: this.getAverageStack(),
            totalChips: this.getTotalChips(),
            biggestStack: this.getBiggestStack(),
            smallestStack: this.getSmallestStack()
        };
    }
    
    getAverageStack() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 0) return 0;
        
        const total = activePlayers.reduce((sum, p) => sum + p.chips, 0);
        return Math.floor(total / activePlayers.length);
    }
    
    getTotalChips() {
        return this.players.reduce((sum, p) => sum + p.chips, 0);
    }
    
    getBiggestStack() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 0) return { player: null, chips: 0 };
        
        const player = activePlayers.reduce((max, p) => p.chips > max.chips ? p : max, activePlayers[0]);
        return { player: player.nickname, chips: player.chips };
    }
    
    getSmallestStack() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 0) return { player: null, chips: 0 };
        
        const player = activePlayers.reduce((min, p) => p.chips < min.chips ? p : min, activePlayers[0]);
        return { player: player.nickname, chips: player.chips };
    }
    
    // ================ MÉTODOS DE SERIALIZAÇÃO ================
    
    toJSON() {
        return {
            maxPlayers: this.maxPlayers,
            players: this.players.map(p => p.toJSON()),
            seats: this.seats,
            activeCount: this.activeCount,
            eliminatedCount: this.eliminatedCount,
            connectedCount: this.connectedCount,
            stats: this.getTableStats()
        };
    }
    
    static fromJSON(jsonData, CardClass) {
        const manager = new PlayerManager(jsonData.maxPlayers);
        
        // Restaura jogadores
        jsonData.players.forEach(playerData => {
            const player = PokerPlayer.fromJSON(playerData, CardClass);
            manager.players.push(player);
            manager.playerMap.set(player.userId, player);
        });
        
        // Restaura estado dos assentos
        manager.seats = jsonData.seats;
        manager.activeCount = jsonData.activeCount;
        manager.eliminatedCount = jsonData.eliminatedCount;
        manager.connectedCount = jsonData.connectedCount;
        
        return manager;
    }
    
    // ================ MÉTODOS DE UTILIDADE ================
    
    // Verifica se a mesa está cheia
    isFull() {
        return this.players.length >= this.maxPlayers;
    }
    
    // Verifica se há jogadores suficientes para começar
    canStartGame(minPlayers = 2) {
        const eligiblePlayers = this.getPlayersEligibleForCards();
        return eligiblePlayers.length >= minPlayers;
    }
    
    // Atualiza estado de conexão
    updateConnectionStatus(userId, isConnected) {
        const player = this.getPlayerById(userId);
        if (player) {
            player.connected = isConnected;
            player.lastSeen = new Date();
            
            if (isConnected) {
                this.connectedCount++;
                console.log(`🔗 ${player.nickname} conectado`);
            } else {
                this.connectedCount--;
                console.log(`🔌 ${player.nickname} desconectado`);
            }
        }
    }
    
    // Kick jogador por inatividade
    kickInactivePlayers(maxInactivityMinutes = 5) {
        const now = new Date();
        const kicked = [];
        
        this.players.forEach(player => {
            if (!player.connected && !player.isBot) {
                const minutesInactive = (now - new Date(player.lastSeen)) / (1000 * 60);
                
                if (minutesInactive > maxInactivityMinutes) {
                    this.removePlayer(player.userId);
                    kicked.push(player.nickname);
                    console.log(`⏰ ${player.nickname} removido por inatividade`);
                }
            }
        });
        
        return kicked;
    }
    
    // Distribui fichas iniciais igualmente (para rebuy)
    redistributeChips(chipsPerPlayer = 1500) {
        this.players.forEach(player => {
            if (player.isActive && player.chips <= 0) {
                player.chips = chipsPerPlayer;
                player.startingChips = chipsPerPlayer;
                player.isEliminated = false;
                console.log(`🔄 ${player.nickname} recebeu ${chipsPerPlayer} fichas`);
            }
        });
    }
}

// ================ FUNÇÕES DE UTILIDADE ================

// Cria um jogador bot
export function createBotPlayer(botName, difficulty = 'medium') {
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chips = 1500 + Math.floor(Math.random() * 1000);
    
    const bot = new PokerPlayer(botId, botName, chips, 0, true);
    bot.botDifficulty = difficulty;
    
    return bot;
}

// Ordena jogadores por stack size
export function sortPlayersByStack(players, descending = true) {
    return [...players].sort((a, b) => {
        return descending ? b.chips - a.chips : a.chips - b.chips;
    });
}

// Ordena jogadores por posição
export function sortPlayersByPosition(players, startPosition = 0, maxPositions = 9) {
    return [...players].sort((a, b) => {
        let aDist = (a.position - startPosition + maxPositions) % maxPositions;
        let bDist = (b.position - startPosition + maxPositions) % maxPositions;
        return aDist - bDist;
    });
}

// Calcula blind apropriado baseado nos stacks
export function calculateAppropriateBlind(players) {
    const stacks = players.map(p => p.chips);
    const avgStack = stacks.reduce((a, b) => a + b, 0) / stacks.length;
    
    // Encontra blind mais próximo de 1-2% do stack médio
    const possibleBlinds = [10, 25, 50, 100, 200, 500, 1000, 2000];
    const target = avgStack * 0.015; // 1.5%
    
    return possibleBlinds.reduce((prev, curr) => {
        return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
    });
}

// Exporta tudo
export default {
    PokerPlayer,
    PlayerManager,
    createBotPlayer,
    sortPlayersByStack,
    sortPlayersByPosition,
    calculateAppropriateBlind
};