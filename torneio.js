/**
 * SISTEMA COMPLETO DE TORNEIO DE POKER
 * Arquivo: torneio.js
 * Responsável por: Estrutura de torneio, blinds, níveis, premiação, ranking
 */

// ================ CONSTANTES DE TORNEIO ================
export const TOURNAMENT_TYPES = {
    SNG: 'SNG',           // Sit & Go
    MTT: 'MTT',           // Multi Table Tournament
    FREEROLL: 'FREEROLL', // Torneio gratuito
    BOUNTY: 'BOUNTY',     // Bounty Tournament
    REBUY: 'REBUY',       // Com rebuy
    DEEPSTACK: 'DEEPSTACK' // Deep Stack
};

export const TOURNAMENT_STATUS = {
    REGISTERING: 'registering',   // Inscrições abertas
    STARTING: 'starting',         // Começando em breve
    ACTIVE: 'active',             // Em andamento
    PAUSED: 'paused',             // Pausado
    BREAK: 'break',               // Intervalo
    FINISHED: 'finished',         // Finalizado
    CANCELLED: 'cancelled'        // Cancelado
};

export const PAYOUT_STRUCTURES = {
    STANDARD: [0.50, 0.30, 0.20],           // 50%, 30%, 20%
    HEADS_UP: [0.70, 0.30],                 // 70%, 30%
    SIX_MAX: [0.45, 0.25, 0.15, 0.10, 0.05], // 45%, 25%, 15%, 10%, 5%
    MTT: [0.40, 0.20, 0.12, 0.08, 0.06, 0.05, 0.04, 0.03, 0.02] // 9 lugares
};

// ================ ESTRUTURA DE BLINDS ================
export const BLIND_STRUCTURES = {
    TURBO: [
        { level: 1, small: 10, big: 20, ante: 0, duration: 5, color: 'green' },
        { level: 2, small: 15, big: 30, ante: 0, duration: 5, color: 'green' },
        { level: 3, small: 25, big: 50, ante: 0, duration: 5, color: 'green' },
        { level: 4, small: 50, big: 100, ante: 0, duration: 5, color: 'yellow' },
        { level: 5, small: 75, big: 150, ante: 0, duration: 5, color: 'yellow' },
        { level: 6, small: 100, big: 200, ante: 0, duration: 5, color: 'yellow' },
        { level: 7, small: 150, big: 300, ante: 25, duration: 5, color: 'orange' },
        { level: 8, small: 200, big: 400, ante: 50, duration: 5, color: 'orange' },
        { level: 9, small: 300, big: 600, ante: 75, duration: 5, color: 'red' },
        { level: 10, small: 500, big: 1000, ante: 100, duration: 5, color: 'red' }
    ],
    
    REGULAR: [
        { level: 1, small: 10, big: 20, ante: 0, duration: 10, color: 'green' },
        { level: 2, small: 15, big: 30, ante: 0, duration: 10, color: 'green' },
        { level: 3, small: 25, big: 50, ante: 0, duration: 10, color: 'green' },
        { level: 4, small: 50, big: 100, ante: 0, duration: 10, color: 'green' },
        { level: 5, small: 75, big: 150, ante: 0, duration: 10, color: 'yellow' },
        { level: 6, small: 100, big: 200, ante: 0, duration: 10, color: 'yellow' },
        { level: 7, small: 150, big: 300, ante: 0, duration: 10, color: 'yellow' },
        { level: 8, small: 200, big: 400, ante: 25, duration: 10, color: 'orange' },
        { level: 9, small: 300, big: 600, ante: 50, duration: 10, color: 'orange' },
        { level: 10, small: 400, big: 800, ante: 75, duration: 10, color: 'orange' },
        { level: 11, small: 500, big: 1000, ante: 100, duration: 10, color: 'red' },
        { level: 12, small: 750, big: 1500, ante: 150, duration: 10, color: 'red' }
    ],
    
    DEEPSTACK: [
        { level: 1, small: 10, big: 20, ante: 0, duration: 20, color: 'green' },
        { level: 2, small: 15, big: 30, ante: 0, duration: 20, color: 'green' },
        { level: 3, small: 25, big: 50, ante: 0, duration: 20, color: 'green' },
        { level: 4, small: 50, big: 100, ante: 0, duration: 20, color: 'green' },
        { level: 5, small: 75, big: 150, ante: 0, duration: 20, color: 'green' },
        { level: 6, small: 100, big: 200, ante: 0, duration: 20, color: 'yellow' },
        { level: 7, small: 150, big: 300, ante: 0, duration: 20, color: 'yellow' },
        { level: 8, small: 200, big: 400, ante: 0, duration: 20, color: 'yellow' },
        { level: 9, small: 300, big: 600, ante: 25, duration: 20, color: 'orange' },
        { level: 10, small: 400, big: 800, ante: 50, duration: 20, color: 'orange' },
        { level: 11, small: 500, big: 1000, ante: 75, duration: 20, color: 'orange' },
        { level: 12, small: 750, big: 1500, ante: 100, duration: 20, color: 'red' }
    ]
};

// ================ CLASSE JOGADOR DE TORNEIO ================
export class TournamentPlayer {
    constructor(userId, nickname, stack = 0, isBot = false) {
        this.userId = userId;
        this.nickname = nickname || `Player_${userId.slice(-4)}`;
        this.stack = stack;
        this.startingStack = stack;
        this.position = 0;
        this.isBot = isBot;
        this.isActive = true;
        this.isEliminated = false;
        this.eliminatedAt = null;
        this.eliminatedBy = null;
        this.eliminatedHand = null;
        this.finalPosition = 0;
        this.prize = 0;
        this.bounties = 0;
        this.rebuys = 0;
        this.addOns = 0;
        this.totalInvestment = 0;
        this.roi = 0;
        this.icm = 0; // Independent Chip Model
        this.stats = {
            handsPlayed: 0,
            handsWon: 0,
            knockouts: 0,
            bountiesWon: 0,
            averageStack: stack,
            biggestStack: stack,
            smallestStack: stack,
            mostChips: stack,
            timePlayed: 0 // em minutos
        };
        this.performance = {
            vpip: 0,
            pfr: 0,
            aggression: 0,
            stealAttempts: 0,
            stealSuccess: 0,
            threeBets: 0,
            foldsToThreeBet: 0
        };
    }
    
    // Elimina jogador
    eliminate(eliminatedBy = null, hand = null) {
        this.isActive = false;
        this.isEliminated = true;
        this.eliminatedAt = new Date();
        this.eliminatedBy = eliminatedBy;
        this.eliminatedHand = hand;
        this.stack = 0;
        
        console.log(`☠️ ${this.nickname} eliminado por ${eliminatedBy?.nickname || 'desconhecido'}`);
        return this;
    }
    
    // Atualiza stack
    updateStack(newStack) {
        const oldStack = this.stack;
        this.stack = Math.max(0, newStack);
        
        // Atualiza estatísticas
        if (this.stack > this.stats.biggestStack) {
            this.stats.biggestStack = this.stack;
        }
        if (this.stack < this.stats.smallestStack && this.stack > 0) {
            this.stats.smallestStack = this.stack;
        }
        
        this.stats.averageStack = ((this.stats.averageStack * this.stats.handsPlayed) + this.stack) / 
                                  (this.stats.handsPlayed + 1);
        
        return { old: oldStack, new: this.stack, change: this.stack - oldStack };
    }
    
    // Adiciona knockouts
    addKnockout(bounty = 0) {
        this.stats.knockouts++;
        this.bounties += bounty;
        this.stats.bountiesWon += bounty;
        console.log(`🥊 ${this.nickname} fez knockout (+${bounty} bounty)`);
        return this.stats.knockouts;
    }
    
    // Adiciona rebuy
    addRebuy(amount) {
        this.rebuys++;
        this.stack += amount;
        this.totalInvestment += amount;
        console.log(`🔄 ${this.nickname} fez rebuy de ${amount}`);
        return this.stack;
    }
    
    // Adiciona add-on
    addAddOn(amount) {
        this.addOns++;
        this.stack += amount;
        this.totalInvestment += amount;
        console.log(`➕ ${this.nickname} fez add-on de ${amount}`);
        return this.stack;
    }
    
    // Calcula ROI
    calculateROI() {
        if (this.totalInvestment <= 0) return 0;
        this.roi = ((this.prize + this.bounties - this.totalInvestment) / this.totalInvestment) * 100;
        return this.roi;
    }
    
    // Serialização
    toJSON() {
        return {
            userId: this.userId,
            nickname: this.nickname,
            stack: this.stack,
            startingStack: this.startingStack,
            position: this.position,
            isBot: this.isBot,
            isActive: this.isActive,
            isEliminated: this.isEliminated,
            eliminatedAt: this.eliminatedAt?.toISOString(),
            eliminatedBy: this.eliminatedBy,
            eliminatedHand: this.eliminatedHand,
            finalPosition: this.finalPosition,
            prize: this.prize,
            bounties: this.bounties,
            rebuys: this.rebuys,
            addOns: this.addOns,
            totalInvestment: this.totalInvestment,
            roi: this.calculateROI(),
            icm: this.icm,
            stats: this.stats,
            performance: this.performance,
            mValue: this.getMValue() // Valor M (Harrington)
        };
    }
    
    // Calcula valor M (Harrington M-ratio)
    getMValue(smallBlind = 0, bigBlind = 0, ante = 0, playersAtTable = 9) {
        if (smallBlind === 0 || bigBlind === 0) return 0;
        
        const costPerRound = smallBlind + bigBlind + (ante * playersAtTable);
        if (costPerRound === 0) return 0;
        
        return this.stack / costPerRound;
    }
    
    // Calcula Q (índice de qualidade)
    getQValue() {
        const m = this.getMValue();
        if (m === 0) return 0;
        
        // Fórmula simplificada
        return Math.min(10, Math.floor(m * 2));
    }
    
    // Status do jogador
    getStatus() {
        if (this.isEliminated) return 'Eliminado';
        if (!this.isActive) return 'Inativo';
        if (this.getMValue() < 5) return 'Perigo';
        if (this.getMValue() < 10) return 'Atenção';
        return 'Seguro';
    }
}

// ================ CLASSE TORNEIO ================
export class PokerTournament {
    constructor(config = {}) {
        // Configuração básica
        this.id = config.id || `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = config.name || 'Torneio de Poker';
        this.type = config.type || TOURNAMENT_TYPES.SNG;
        this.status = config.status || TOURNAMENT_STATUS.REGISTERING;
        
        // Estrutura
        this.blindStructure = config.blindStructure || BLIND_STRUCTURES.REGULAR;
        this.payoutStructure = config.payoutStructure || PAYOUT_STRUCTURES.STANDARD;
        this.maxPlayers = config.maxPlayers || 9;
        this.minPlayers = config.minPlayers || 2;
        this.startingStack = config.startingStack || 1500;
        this.buyIn = config.buyIn || 100; // Em fichas ou valor real
        this.fee = config.fee || 10; // Taxa
        this.bounty = config.bounty || 0; // Para bounty tournaments
        this.isRebuy = config.isRebuy || false;
        this.isAddOn = config.isAddOn || false;
        this.rebuyStack = config.rebuyStack || this.startingStack;
        this.addOnStack = config.addOnStack || this.startingStack;
        this.rebuyPeriod = config.rebuyPeriod || 6; // Níveis de rebuy
        this.breakDuration = config.breakDuration || 5; // minutos
        
        // Tempo e níveis
        this.currentLevel = config.currentLevel || 0;
        this.currentSmallBlind = config.currentSmallBlind || 10;
        this.currentBigBlind = config.currentBigBlind || 20;
        this.currentAnte = config.currentAnte || 0;
        this.levelStartTime = config.levelStartTime || new Date();
        this.levelDuration = config.levelDuration || 10; // minutos
        this.nextBreakAtLevel = config.nextBreakAtLevel || 6;
        this.breakTimeRemaining = 0;
        
        // Jogadores
        this.players = []; // TournamentPlayer[]
        this.playerMap = new Map(); // userId -> TournamentPlayer
        this.registeredCount = 0;
        this.activeCount = 0;
        this.eliminatedCount = 0;
        this.rebuyCount = 0;
        this.addOnCount = 0;
        this.bountyPool = 0;
        this.totalPrizePool = 0;
        this.guaranteedPrizePool = config.guaranteedPrizePool || 0;
        
        // Rankings e prêmios
        this.finalRankings = [];
        this.prizeDistribution = [];
        this.paidPlaces = 0;
        
        // Mesas (para MTT)
        this.tables = [];
        this.maxTables = config.maxTables || 1;
        this.isFinalTable = false;
        
        // Controle
        this.createdAt = config.createdAt || new Date();
        this.startedAt = null;
        this.finishedAt = null;
        this.pauseStartTime = null;
        this.totalPauseTime = 0; // em minutos
        this.isPaused = false;
        this.isBreaking = false;
        
        // Estatísticas
        this.stats = {
            totalHands: 0,
            averagePot: 0,
            biggestPot: 0,
            fastestElimination: null,
            mostKnockouts: 0,
            mostKnockoutsPlayer: null,
            biggestStack: 0,
            biggestStackPlayer: null,
            averageStack: this.startingStack,
            totalChipsInPlay: 0
        };
        
        // Logs
        this.eventLog = [];
        this.handHistory = [];
        
        // Inicializa
        this.calculatePrizePool();
        this.logEvent('tournament_created', `Torneio ${this.name} criado`);
    }
    
    // ================ MÉTODOS DE INSCRIÇÃO ================
    
    // Registra jogador no torneio
    registerPlayer(userId, nickname, isBot = false) {
        if (this.status !== TOURNAMENT_STATUS.REGISTERING) {
            throw new Error('Inscrições fechadas');
        }
        
        if (this.registeredCount >= this.maxPlayers) {
            throw new Error('Torneio lotado');
        }
        
        if (this.playerMap.has(userId)) {
            throw new Error('Jogador já inscrito');
        }
        
        const player = new TournamentPlayer(
            userId, 
            nickname, 
            this.startingStack, 
            isBot
        );
        
        player.position = this.registeredCount;
        player.totalInvestment = this.buyIn;
        
        this.players.push(player);
        this.playerMap.set(userId, player);
        this.registeredCount++;
        this.activeCount++;
        
        this.calculatePrizePool();
        
        this.logEvent('player_registered', 
            `${nickname} se inscreveu no torneio`,
            { playerId: userId, stack: this.startingStack }
        );
        
        console.log(`📝 ${nickname} inscrito no torneio`);
        return player;
    }
    
    // Remove jogador (antes do início)
    unregisterPlayer(userId) {
        if (this.status !== TOURNAMENT_STATUS.REGISTERING) {
            throw new Error('Não pode remover após início do torneio');
        }
        
        const player = this.playerMap.get(userId);
        if (!player) return false;
        
        const index = this.players.findIndex(p => p.userId === userId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
        
        this.playerMap.delete(userId);
        this.registeredCount--;
        this.activeCount--;
        
        this.calculatePrizePool();
        
        this.logEvent('player_unregistered',
            `${player.nickname} cancelou inscrição`,
            { playerId: userId }
        );
        
        console.log(`❌ ${player.nickname} removido do torneio`);
        return true;
    }
    
    // ================ MÉTODOS DE INÍCIO ================
    
    // Inicia o torneio
    start() {
        if (this.status !== TOURNAMENT_STATUS.REGISTERING) {
            throw new Error('Torneio já iniciado ou finalizado');
        }
        
        if (this.registeredCount < this.minPlayers) {
            throw new Error(`Mínimo de ${this.minPlayers} jogadores necessários`);
        }
        
        this.status = TOURNAMENT_STATUS.ACTIVE;
        this.startedAt = new Date();
        this.currentLevel = 0;
        this.advanceLevel();
        
        // Distribui jogadores em mesas
        this.distributePlayersToTables();
        
        this.logEvent('tournament_started',
            `Torneio iniciado com ${this.registeredCount} jogadores`,
            {
                players: this.registeredCount,
                prizePool: this.totalPrizePool,
                startingStack: this.startingStack
            }
        );
        
        console.log(`🚀 Torneio ${this.name} iniciado!`);
        return true;
    }
    
    // Distribui jogadores em mesas
    distributePlayersToTables() {
        this.tables = [];
        
        // Para SNG, apenas uma mesa
        if (this.type === TOURNAMENT_TYPES.SNG || this.maxTables === 1) {
            const table = {
                id: 'table_1',
                players: [...this.players],
                seats: 9,
                isActive: true,
                dealerPosition: 0
            };
            this.tables.push(table);
            this.isFinalTable = true;
        } else {
            // Para MTT, distribui entre múltiplas mesas
            const playersPerTable = Math.ceil(this.registeredCount / this.maxTables);
            
            for (let i = 0; i < this.maxTables; i++) {
                const startIdx = i * playersPerTable;
                const endIdx = Math.min(startIdx + playersPerTable, this.registeredCount);
                const tablePlayers = this.players.slice(startIdx, endIdx);
                
                if (tablePlayers.length > 0) {
                    const table = {
                        id: `table_${i + 1}`,
                        players: tablePlayers,
                        seats: 9,
                        isActive: true,
                        dealerPosition: 0
                    };
                    this.tables.push(table);
                }
            }
        }
        
        console.log(`🎪 ${this.tables.length} mesa(s) criada(s)`);
    }
    
    // ================ MÉTODOS DE NÍVEL/BLINDS ================
    
    // Avança para próximo nível de blinds
    advanceLevel() {
        if (this.currentLevel >= this.blindStructure.length - 1) {
            console.log('⚠️ Último nível alcançado');
            return false;
        }
        
        this.currentLevel++;
        const level = this.blindStructure[this.currentLevel];
        
        this.currentSmallBlind = level.small;
        this.currentBigBlind = level.big;
        this.currentAnte = level.ante;
        this.levelDuration = level.duration;
        this.levelStartTime = new Date();
        
        // Verifica se é hora do intervalo
        if (this.currentLevel === this.nextBreakAtLevel) {
            this.startBreak();
        }
        
        this.logEvent('level_advanced',
            `Nível ${this.currentLevel}: ${this.currentSmallBlind}/${this.currentBigBlind}${this.currentAnte > 0 ? ` ante ${this.currentAnte}` : ''}`,
            {
                level: this.currentLevel,
                smallBlind: this.currentSmallBlind,
                bigBlind: this.currentBigBlind,
                ante: this.currentAnte,
                duration: this.levelDuration
            }
        );
        
        console.log(`📈 Nível ${this.currentLevel}: ${this.currentSmallBlind}/${this.currentBigBlind}${this.currentAnte > 0 ? ` ante ${this.currentAnte}` : ''}`);
        return true;
    }
    
    // Obtém informações do nível atual
    getCurrentLevelInfo() {
        const level = this.blindStructure[this.currentLevel] || this.blindStructure[0];
        const nextLevel = this.blindStructure[this.currentLevel + 1];
        
        return {
            current: {
                level: this.currentLevel + 1,
                small: this.currentSmallBlind,
                big: this.currentBigBlind,
                ante: this.currentAnte,
                duration: this.levelDuration,
                color: level.color || 'green',
                startTime: this.levelStartTime,
                elapsedMinutes: this.getElapsedLevelMinutes(),
                remainingMinutes: Math.max(0, this.levelDuration - this.getElapsedLevelMinutes())
            },
            next: nextLevel ? {
                level: this.currentLevel + 2,
                small: nextLevel.small,
                big: nextLevel.big,
                ante: nextLevel.ante,
                duration: nextLevel.duration,
                color: nextLevel.color
            } : null,
            progress: this.getLevelProgress()
        };
    }
    
    // Calcula progresso do nível atual
    getLevelProgress() {
        const elapsed = this.getElapsedLevelMinutes();
        return Math.min(100, (elapsed / this.levelDuration) * 100);
    }
    
    // Obtém minutos decorridos no nível atual
    getElapsedLevelMinutes() {
        if (!this.levelStartTime) return 0;
        
        const now = new Date();
        const elapsedMs = now - this.levelStartTime;
        
        // Subtrai tempo de pausa
        const pauseTime = this.isPaused ? (now - this.pauseStartTime) : 0;
        
        return Math.floor((elapsedMs - pauseTime) / (1000 * 60));
    }
    
    // Calcula quanto tempo até próxima atualização de blind
    getTimeToNextLevel() {
        const elapsed = this.getElapsedLevelMinutes();
        return Math.max(0, this.levelDuration - elapsed);
    }
    
    // ================ MÉTODOS DE INTERVALO ================
    
    // Inicia intervalo
    startBreak() {
        this.isBreaking = true;
        this.breakTimeRemaining = this.breakDuration;
        
        this.logEvent('break_started',
            `Intervalo de ${this.breakDuration} minutos`,
            { duration: this.breakDuration }
        );
        
        console.log(`☕ Intervalo de ${this.breakDuration} minutos`);
        return true;
    }
    
    // Finaliza intervalo
    endBreak() {
        this.isBreaking = false;
        this.breakTimeRemaining = 0;
        this.nextBreakAtLevel = this.currentLevel + 6; // Próximo intervalo em 6 níveis
        
        this.logEvent('break_ended',
            'Intervalo finalizado',
            { nextBreakAt: this.nextBreakAtLevel }
        );
        
        console.log('⏰ Intervalo finalizado');
        return true;
    }
    
    // Atualiza tempo do intervalo
    updateBreakTime() {
        if (this.isBreaking && this.breakTimeRemaining > 0) {
            this.breakTimeRemaining--;
            
            if (this.breakTimeRemaining <= 0) {
                this.endBreak();
            }
            
            return this.breakTimeRemaining;
        }
        return 0;
    }
    
    // ================ MÉTODOS DE PAUSA ================
    
    // Pausa torneio
    pause() {
        if (this.isPaused) return false;
        
        this.isPaused = true;
        this.pauseStartTime = new Date();
        this.status = TOURNAMENT_STATUS.PAUSED;
        
        this.logEvent('tournament_paused',
            'Torneio pausado',
            { pauseStart: this.pauseStartTime }
        );
        
        console.log('⏸️ Torneio pausado');
        return true;
    }
    
    // Despausa torneio
    resume() {
        if (!this.isPaused) return false;
        
        const pauseEndTime = new Date();
        const pauseDuration = Math.floor((pauseEndTime - this.pauseStartTime) / (1000 * 60));
        
        this.totalPauseTime += pauseDuration;
        this.isPaused = false;
        this.pauseStartTime = null;
        this.status = TOURNAMENT_STATUS.ACTIVE;
        
        this.logEvent('tournament_resumed',
            `Torneio retomado após ${pauseDuration} minutos`,
            { pauseDuration, totalPauseTime: this.totalPauseTime }
        );
        
        console.log(`▶️ Torneio retomado após ${pauseDuration} minutos`);
        return true;
    }
    
    // ================ MÉTODOS DE ELIMINAÇÃO ================
    
    // Elimina jogador
    eliminatePlayer(playerId, eliminatedById = null, hand = null) {
        const player = this.playerMap.get(playerId);
        if (!player || player.isEliminated) return false;
        
        player.eliminate(
            eliminatedById ? this.playerMap.get(eliminatedById) : null,
            hand
        );
        
        this.activeCount--;
        this.eliminatedCount++;
        
        // Adiciona bounty se for bounty tournament
        if (this.bounty > 0 && eliminatedById) {
            const eliminator = this.playerMap.get(eliminatedById);
            if (eliminator) {
                eliminator.addKnockout(this.bounty);
                this.bountyPool += this.bounty;
            }
        }
        
        // Atualiza posição final
        player.finalPosition = this.eliminatedCount;
        
        // Verifica se chegou à mesa final
        this.checkForFinalTable();
        
        // Verifica se torneio acabou
        if (this.activeCount === 1) {
            this.finish();
        }
        
        this.logEvent('player_eliminated',
            `${player.nickname} eliminado em ${this.ordinalSuffix(player.finalPosition)} lugar`,
            {
                playerId: playerId,
                eliminatedBy: eliminatedById,
                position: player.finalPosition,
                hand: hand
            }
        );
        
        console.log(`🏆 ${player.nickname} eliminado em ${this.ordinalSuffix(player.finalPosition)} lugar`);
        return true;
    }
    
    // Verifica se precisa criar mesa final
    checkForFinalTable() {
        if (this.isFinalTable) return;
        
        if (this.activeCount <= 9 && this.tables.length > 1) {
            // Combina todos jogadores em uma mesa
            const allActivePlayers = this.players.filter(p => p.isActive);
            this.tables = [{
                id: 'final_table',
                players: allActivePlayers,
                seats: 9,
                isActive: true,
                dealerPosition: 0,
                isFinalTable: true
            }];
            
            this.isFinalTable = true;
            
            this.logEvent('final_table_reached',
                `Mesa final alcançada com ${this.activeCount} jogadores`,
                { players: this.activeCount }
            );
            
            console.log(`👑 Mesa final alcançada!`);
        }
    }
    
    // ================ MÉTODOS DE REBUY/ADD-ON ================
    
    // Processa rebuy
    processRebuy(playerId) {
        if (!this.isRebuy) return false;
        
        // Verifica se ainda está no período de rebuy
        if (this.currentLevel > this.rebuyPeriod) {
            console.log('⚠️ Período de rebuy encerrado');
            return false;
        }
        
        const player = this.playerMap.get(playerId);
        if (!player || player.isEliminated) return false;
        
        player.addRebuy(this.rebuyStack);
        this.rebuyCount++;
        this.totalPrizePool += this.buyIn;
        
        this.logEvent('player_rebuy',
            `${player.nickname} fez rebuy`,
            { playerId, rebuyStack: this.rebuyStack }
        );
        
        return true;
    }
    
    // Processa add-on
    processAddOn(playerId) {
        if (!this.isAddOn) return false;
        
        const player = this.playerMap.get(playerId);
        if (!player || player.isEliminated) return false;
        
        player.addAddOn(this.addOnStack);
        this.addOnCount++;
        this.totalPrizePool += this.buyIn;
        
        this.logEvent('player_addon',
            `${player.nickname} fez add-on`,
            { playerId, addOnStack: this.addOnStack }
        );
        
        return true;
    }
    
    // ================ MÉTODOS DE PRÊMIO ================
    
    // Calcula prize pool
    calculatePrizePool() {
        let prizePool = this.registeredCount * this.buyIn;
        
        // Adiciona garantia se maior
        if (this.guaranteedPrizePool > 0 && prizePool < this.guaranteedPrizePool) {
            prizePool = this.guaranteedPrizePool;
        }
        
        this.totalPrizePool = prizePool;
        
        // Calcula lugares pagos
        this.calculatePaidPlaces();
        
        // Calcula distribuição de prêmios
        this.calculatePrizeDistribution();
        
        return prizePool;
    }
    
    // Calcula quantos lugares serão pagos
    calculatePaidPlaces() {
        // Regra padrão: paga aproximadamente 15% dos jogadores
        this.paidPlaces = Math.max(1, Math.floor(this.registeredCount * 0.15));
        
        // Ajusta baseado na estrutura de payout
        if (this.payoutStructure.length < this.paidPlaces) {
            this.paidPlaces = this.payoutStructure.length;
        }
        
        return this.paidPlaces;
    }
    
    // Calcula distribuição de prêmios
    calculatePrizeDistribution() {
        this.prizeDistribution = [];
        
        for (let i = 0; i < this.paidPlaces; i++) {
            const percentage = this.payoutStructure[i] || 0;
            const amount = Math.floor(this.totalPrizePool * percentage);
            
            this.prizeDistribution.push({
                position: i + 1,
                percentage: percentage * 100,
                amount: amount
            });
        }
        
        return this.prizeDistribution;
    }
    
    // Distribui prêmios ao final do torneio
    distributePrizes() {
        if (this.status !== TOURNAMENT_STATUS.FINISHED) {
            throw new Error('Torneio ainda não finalizado');
        }
        
        const winners = this.finalRankings.slice(0, this.paidPlaces);
        
        winners.forEach((player, index) => {
            const prize = this.prizeDistribution[index];
            if (prize) {
                player.prize = prize.amount;
                
                this.logEvent('prize_awarded',
                    `${player.nickname} ganhou ${prize.amount}`,
                    {
                        playerId: player.userId,
                        position: player.finalPosition,
                        prize: prize.amount,
                        percentage: prize.percentage
                    }
                );
            }
        });
        
        console.log(`💰 Prêmios distribuídos para ${winners.length} jogadores`);
        return winners;
    }
    
    // ================ MÉTODOS DE FINALIZAÇÃO ================
    
    // Finaliza torneio
    finish() {
        if (this.status === TOURNAMENT_STATUS.FINISHED) return false;
        
        this.status = TOURNAMENT_STATUS.FINISHED;
        this.finishedAt = new Date();
        
        // Cria ranking final
        this.createFinalRankings();
        
        // Distribui prêmios
        this.distributePrizes();
        
        // Calcula estatísticas finais
        this.calculateFinalStats();
        
        this.logEvent('tournament_finished',
            `Torneio finalizado. Vencedor: ${this.finalRankings[0]?.nickname || 'N/A'}`,
            {
                duration: this.getTournamentDuration(),
                players: this.registeredCount,
                winner: this.finalRankings[0]?.userId,
                prizePool: this.totalPrizePool
            }
        );
        
        console.log(`🎉 Torneio ${this.name} finalizado! Vencedor: ${this.finalRankings[0]?.nickname}`);
        return true;
    }
    
    // Cria rankings finais
    createFinalRankings() {
        // Ordena por stack (últimos ativos primeiro, depois eliminados)
        const activePlayers = this.players.filter(p => p.isActive);
        const eliminatedPlayers = this.players.filter(p => p.isEliminated)
            .sort((a, b) => a.finalPosition - b.finalPosition);
        
        // O último ativo é o vencedor (posição 1)
        const rankings = [...activePlayers.reverse(), ...eliminatedPlayers];
        
        rankings.forEach((player, index) => {
            player.finalPosition = index + 1;
        });
        
        this.finalRankings = rankings;
        return rankings;
    }
    
    // Calcula estatísticas finais
    calculateFinalStats() {
        const activePlayers = this.players.filter(p => p.isActive);
        
        if (activePlayers.length === 0) return;
        
        // Maior stack
        const biggestStackPlayer = activePlayers.reduce((max, p) => 
            p.stats.mostChips > max.stats.mostChips ? p : max, activePlayers[0]
        );
        
        // Mais knockouts
        const mostKnockoutsPlayer = this.players.reduce((max, p) => 
            p.stats.knockouts > max.stats.knockouts ? p : max, this.players[0]
        );
        
        this.stats.biggestStack = biggestStackPlayer.stats.mostChips;
        this.stats.biggestStackPlayer = biggestStackPlayer.userId;
        this.stats.mostKnockouts = mostKnockoutsPlayer.stats.knockouts;
        this.stats.mostKnockoutsPlayer = mostKnockoutsPlayer.userId;
        this.stats.averageStack = this.getAverageStack();
        this.stats.totalChipsInPlay = this.getTotalChipsInPlay();
    }
    
    // ================ MÉTODOS DE ESTATÍSTICAS ================
    
    // Obtém stack médio
    getAverageStack() {
        const activePlayers = this.players.filter(p => p.isActive);
        if (activePlayers.length === 0) return 0;
        
        const total = activePlayers.reduce((sum, p) => sum + p.stack, 0);
        return Math.floor(total / activePlayers.length);
    }
    
    // Obtém total de fichas em jogo
    getTotalChipsInPlay() {
        return this.players.reduce((sum, p) => sum + p.stack, 0);
    }
    
    // Obtém duração do torneio
    getTournamentDuration() {
        if (!this.startedAt) return 0;
        
        const endTime = this.finishedAt || new Date();
        const durationMs = endTime - this.startedAt;
        
        // Subtrai tempo de pausa
        const pauseMs = this.totalPauseTime * 60 * 1000;
        
        return Math.floor((durationMs - pauseMs) / (1000 * 60)); // minutos
    }
    
    // Obtém tempo até próximo blind
    getNextBlindTime() {
        if (this.isBreaking) {
            return { type: 'break', time: this.breakTimeRemaining };
        }
        
        const timeToNextLevel = this.getTimeToNextLevel();
        return { type: 'level', time: timeToNextLevel };
    }
    
    // ================ MÉTODOS DE LOG ================
    
    // Adiciona evento ao log
    logEvent(type, message, data = {}) {
        const event = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            message: message,
            data: data,
            timestamp: new Date().toISOString(),
            tournamentId: this.id,
            currentLevel: this.currentLevel,
            activePlayers: this.activeCount
        };
        
        this.eventLog.push(event);
        
        // Mantém apenas últimos 500 eventos
        if (this.eventLog.length > 500) {
            this.eventLog.shift();
        }
        
        return event;
    }
    
    // Adiciona hand ao histórico
    logHand(handData) {
        const handLog = {
            ...handData,
            tournamentId: this.id,
            level: this.currentLevel,
            blinds: `${this.currentSmallBlind}/${this.currentBigBlind}`,
            ante: this.currentAnte,
            timestamp: new Date().toISOString()
        };
        
        this.handHistory.push(handLog);
        this.stats.totalHands++;
        
        // Mantém apenas últimos 1000 mãos
        if (this.handHistory.length > 1000) {
            this.handHistory.shift();
        }
        
        return handLog;
    }
    
    // ================ MÉTODOS DE UTILIDADE ================
    
    // Formata número com sufixo ordinal
    ordinalSuffix(n) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
    
    // Obtém informações para display
    getDisplayInfo() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            status: this.status,
            registeredPlayers: this.registeredCount,
            activePlayers: this.activeCount,
            eliminatedPlayers: this.eliminatedCount,
            prizePool: this.totalPrizePool,
            guaranteed: this.guaranteedPrizePool,
            buyIn: this.buyIn,
            fee: this.fee,
            currentLevel: this.getCurrentLevelInfo(),
            timeToNextBlind: this.getNextBlindTime(),
            averageStack: this.getAverageStack(),
            paidPlaces: this.paidPlaces,
            isRebuy: this.isRebuy,
            isAddOn: this.isAddOn,
            isFinalTable: this.isFinalTable,
            tables: this.tables.length,
            duration: this.getTournamentDuration(),
            isPaused: this.isPaused,
            isBreaking: this.isBreaking
        };
    }
    
    // Obtém informações para leaderboard
    getLeaderboard(limit = 10) {
        // Para torneio ativo, ordena por stack
        if (this.status === TOURNAMENT_STATUS.ACTIVE) {
            const activePlayers = this.players
                .filter(p => p.isActive)
                .sort((a, b) => b.stack - a.stack)
                .slice(0, limit);
            
            return activePlayers.map((p, index) => ({
                position: index + 1,
                playerId: p.userId,
                nickname: p.nickname,
                stack: p.stack,
                isBot: p.isBot,
                mValue: p.getMValue(this.currentSmallBlind, this.currentBigBlind, this.currentAnte, 9),
                status: p.getStatus()
            }));
        }
        
        // Para torneio finalizado, usa ranking final
        return this.finalRankings.slice(0, limit).map(p => ({
            position: p.finalPosition,
            playerId: p.userId,
            nickname: p.nickname,
            prize: p.prize,
            bounties: p.bounties,
            totalWon: p.prize + p.bounties,
            rebuys: p.rebuys,
            roi: p.calculateROI(),
            knockouts: p.stats.knockouts
        }));
    }
    
    // Obtém informações para gráfico de progresso
    getProgressData() {
        const levels = this.blindStructure.slice(0, this.currentLevel + 1);
        const data = [];
        
        levels.forEach((level, index) => {
            const levelNumber = index + 1;
            
            // Estima jogadores restantes baseado no nível
            // (simulação - na prática viria do histórico)
            const estimatedPlayers = Math.max(
                1,
                Math.floor(this.registeredCount * Math.pow(0.85, index))
            );
            
            data.push({
                level: levelNumber,
                smallBlind: level.small,
                bigBlind: level.big,
                ante: level.ante,
                color: level.color,
                estimatedPlayers: estimatedPlayers,
                duration: level.duration
            });
        });
        
        return data;
    }
    
    // ================ MÉTODOS DE SERIALIZAÇÃO ================
    
    toJSON() {
        return {
            // Configuração
            id: this.id,
            name: this.name,
            type: this.type,
            status: this.status,
            
            // Estrutura
            blindStructure: this.blindStructure,
            payoutStructure: this.payoutStructure,
            maxPlayers: this.maxPlayers,
            minPlayers: this.minPlayers,
            startingStack: this.startingStack,
            buyIn: this.buyIn,
            fee: this.fee,
            bounty: this.bounty,
            isRebuy: this.isRebuy,
            isAddOn: this.isAddOn,
            rebuyStack: this.rebuyStack,
            addOnStack: this.addOnStack,
            rebuyPeriod: this.rebuyPeriod,
            breakDuration: this.breakDuration,
            guaranteedPrizePool: this.guaranteedPrizePool,
            
            // Estado atual
            currentLevel: this.currentLevel,
            currentSmallBlind: this.currentSmallBlind,
            currentBigBlind: this.currentBigBlind,
            currentAnte: this.currentAnte,
            levelStartTime: this.levelStartTime?.toISOString(),
            levelDuration: this.levelDuration,
            nextBreakAtLevel: this.nextBreakAtLevel,
            breakTimeRemaining: this.breakTimeRemaining,
            
            // Jogadores
            players: this.players.map(p => p.toJSON()),
            playerMap: Array.from(this.playerMap.entries()),
            registeredCount: this.registeredCount,
            activeCount: this.activeCount,
            eliminatedCount: this.eliminatedCount,
            rebuyCount: this.rebuyCount,
            addOnCount: this.addOnCount,
            bountyPool: this.bountyPool,
            totalPrizePool: this.totalPrizePool,
            
            // Rankings
            finalRankings: this.finalRankings.map(p => p.toJSON()),
            prizeDistribution: this.prizeDistribution,
            paidPlaces: this.paidPlaces,
            
            // Mesas
            tables: this.tables,
            maxTables: this.maxTables,
            isFinalTable: this.isFinalTable,
            
            // Controle
            createdAt: this.createdAt.toISOString(),
            startedAt: this.startedAt?.toISOString(),
            finishedAt: this.finishedAt?.toISOString(),
            pauseStartTime: this.pauseStartTime?.toISOString(),
            totalPauseTime: this.totalPauseTime,
            isPaused: this.isPaused,
            isBreaking: this.isBreaking,
            
            // Estatísticas
            stats: this.stats,
            
            // Logs
            eventLog: this.eventLog.slice(-100), // Últimos 100 eventos
            handHistory: this.handHistory.slice(-50), // Últimas 50 mãos
            tournamentDuration: this.getTournamentDuration()
        };
    }
    
    static fromJSON(jsonData) {
        const config = {
            id: jsonData.id,
            name: jsonData.name,
            type: jsonData.type,
            status: jsonData.status,
            blindStructure: jsonData.blindStructure,
            payoutStructure: jsonData.payoutStructure,
            maxPlayers: jsonData.maxPlayers,
            minPlayers: jsonData.minPlayers,
            startingStack: jsonData.startingStack,
            buyIn: jsonData.buyIn,
            fee: jsonData.fee,
            bounty: jsonData.bounty,
            isRebuy: jsonData.isRebuy,
            isAddOn: jsonData.isAddOn,
            rebuyStack: jsonData.rebuyStack,
            addOnStack: jsonData.addOnStack,
            rebuyPeriod: jsonData.rebuyPeriod,
            breakDuration: jsonData.breakDuration,
            guaranteedPrizePool: jsonData.guaranteedPrizePool,
            currentLevel: jsonData.currentLevel,
            currentSmallBlind: jsonData.currentSmallBlind,
            currentBigBlind: jsonData.currentBigBlind,
            currentAnte: jsonData.currentAnte,
            levelStartTime: jsonData.levelStartTime ? new Date(jsonData.levelStartTime) : null,
            levelDuration: jsonData.levelDuration,
            nextBreakAtLevel: jsonData.nextBreakAtLevel,
            breakTimeRemaining: jsonData.breakTimeRemaining,
            maxTables: jsonData.maxTables,
            createdAt: jsonData.createdAt ? new Date(jsonData.createdAt) : new Date()
        };
        
        const tournament = new PokerTournament(config);
        
        // Restaura jogadores
        tournament.players = (jsonData.players || []).map(playerData => {
            const player = new TournamentPlayer(
                playerData.userId,
                playerData.nickname,
                playerData.stack,
                playerData.isBot
            );
            Object.assign(player, playerData);
            
            // Converte datas
            if (playerData.eliminatedAt) {
                player.eliminatedAt = new Date(playerData.eliminatedAt);
            }
            
            return player;
        });
        
        // Restaura playerMap
        tournament.playerMap = new Map();
        tournament.players.forEach(player => {
            tournament.playerMap.set(player.userId, player);
        });
        
        // Restaura contadores
        tournament.registeredCount = jsonData.registeredCount || 0;
        tournament.activeCount = jsonData.activeCount || 0;
        tournament.eliminatedCount = jsonData.eliminatedCount || 0;
        tournament.rebuyCount = jsonData.rebuyCount || 0;
        tournament.addOnCount = jsonData.addOnCount || 0;
        tournament.bountyPool = jsonData.bountyPool || 0;
        tournament.totalPrizePool = jsonData.totalPrizePool || 0;
        
        // Restaura rankings
        tournament.finalRankings = jsonData.finalRankings || [];
        tournament.prizeDistribution = jsonData.prizeDistribution || [];
        tournament.paidPlaces = jsonData.paidPlaces || 0;
        
        // Restaura mesas
        tournament.tables = jsonData.tables || [];
        tournament.isFinalTable = jsonData.isFinalTable || false;
        
        // Restaura controle de tempo
        tournament.startedAt = jsonData.startedAt ? new Date(jsonData.startedAt) : null;
        tournament.finishedAt = jsonData.finishedAt ? new Date(jsonData.finishedAt) : null;
        tournament.pauseStartTime = jsonData.pauseStartTime ? new Date(jsonData.pauseStartTime) : null;
        tournament.totalPauseTime = jsonData.totalPauseTime || 0;
        tournament.isPaused = jsonData.isPaused || false;
        tournament.isBreaking = jsonData.isBreaking || false;
        
        // Restaura estatísticas
        tournament.stats = jsonData.stats || {};
        
        // Restaura logs
        tournament.eventLog = jsonData.eventLog || [];
        tournament.handHistory = jsonData.handHistory || [];
        
        return tournament;
    }
    
    // ================ MÉTODOS DE TESTE/DEBUG ================
    
    // Simula torneio rápido para testes
    simulateQuickTournament() {
        console.log('🧪 Simulando torneio rápido...');
        
        // Adiciona alguns jogadores
        for (let i = 1; i <= 6; i++) {
            this.registerPlayer(`player_${i}`, `Jogador ${i}`, i > 3);
        }
        
        // Inicia
        this.start();
        
        // Simula algumas eliminações
        setTimeout(() => {
            this.eliminatePlayer('player_6', 'player_1', 'AA vs KK');
        }, 1000);
        
        setTimeout(() => {
            this.eliminatePlayer('player_5', 'player_2', 'QQ vs AK');
        }, 2000);
        
        setTimeout(() => {
            this.eliminatePlayer('player_4', 'player_1', 'Set vs Flush');
        }, 3000);
        
        setTimeout(() => {
            this.eliminatePlayer('player_3', 'player_2', 'All-in preflop');
            this.finish();
        }, 4000);
        
        return this;
    }
}

// ================ FUNÇÕES DE UTILIDADE ================

// Cria estrutura de blinds customizada
export function createBlindStructure(base = 10, levels = 12, multiplier = 1.5, isTurbo = false) {
    const structure = [];
    let currentSmall = base;
    
    for (let i = 1; i <= levels; i++) {
        const small = currentSmall;
        const big = small * 2;
        const ante = i >= 7 ? Math.floor(big * 0.1) : 0;
        const duration = isTurbo ? 5 : 10;
        
        // Determina cor baseada no nível
        let color = 'green';
        if (i >= 7) color = 'orange';
        if (i >= 10) color = 'red';
        
        structure.push({
            level: i,
            small: small,
            big: big,
            ante: ante,
            duration: duration,
            color: color
        });
        
        currentSmall = Math.floor(currentSmall * multiplier);
    }
    
    return structure;
}

// Calcula ICM (Independent Chip Model)
export function calculateICM(stacks, prizes) {
    if (stacks.length !== prizes.length) {
        throw new Error('Stacks e prizes devem ter mesmo tamanho');
    }
    
    const totalChips = stacks.reduce((a, b) => a + b, 0);
    const icmValues = [];
    
    // Algoritmo simplificado de ICM
    for (let i = 0; i < stacks.length; i++) {
        const stack = stacks[i];
        const probability = stack / totalChips;
        const icmValue = prizes.reduce((sum, prize, idx) => {
            // Fórmula simplificada - na prática é mais complexa
            return sum + (prize * Math.pow(probability, idx + 1));
        }, 0);
        
        icmValues.push(icmValue);
    }
    
    return icmValues;
}

// Gera ID único para torneio
export function generateTournamentId() {
    return `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Verifica se pode iniciar torneio
export function canStartTournament(registered, minPlayers, maxPlayers) {
    return registered >= minPlayers && registered <= maxPlayers;
}

// Calcula blind recomendado baseado no stack médio
export function recommendBlindLevel(averageStack, structure) {
    const targetBB = Math.floor(averageStack / 50); // 50 big blinds ideal
    
    for (let i = 0; i < structure.length; i++) {
        if (structure[i].big >= targetBB) {
            return Math.max(0, i - 1);
        }
    }
    
    return structure.length - 1;
}

// Exporta tudo
export default {
    // Constantes
    TOURNAMENT_TYPES,
    TOURNAMENT_STATUS,
    PAYOUT_STRUCTURES,
    BLIND_STRUCTURES,
    
    // Classes
    TournamentPlayer,
    PokerTournament,
    
    // Funções
    createBlindStructure,
    calculateICM,
    generateTournamentId,
    canStartTournament,
    recommendBlindLevel
};