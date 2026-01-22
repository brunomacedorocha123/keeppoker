/**
 * SISTEMA COMPLETO DE POTE PARA POKER TEXAS HOLD'EM
 * Arquivo: pot.js
 * Responsável por: Gerenciamento de pote principal, side pots, distribuição de prêmios
 */

// ================ CLASSE CONTRIBUIÇÃO INDIVIDUAL ================
class PlayerContribution {
    constructor(playerId, amount = 0) {
        this.playerId = playerId;
        this.amount = amount;
        this.isEligible = true;
        this.hasWon = false;
        this.wonAmount = 0;
        this.contributionsByRound = {
            preflop: 0,
            flop: 0,
            turn: 0,
            river: 0
        };
    }
    
    addContribution(amount, round) {
        this.amount += amount;
        if (this.contributionsByRound[round] !== undefined) {
            this.contributionsByRound[round] += amount;
        }
        return this.amount;
    }
    
    reset() {
        this.amount = 0;
        this.isEligible = true;
        this.hasWon = false;
        this.wonAmount = 0;
        Object.keys(this.contributionsByRound).forEach(round => {
            this.contributionsByRound[round] = 0;
        });
    }
    
    toJSON() {
        return {
            playerId: this.playerId,
            amount: this.amount,
            isEligible: this.isEligible,
            hasWon: this.hasWon,
            wonAmount: this.wonAmount,
            contributionsByRound: { ...this.contributionsByRound }
        };
    }
}

// ================ CLASSE POTE INDIVIDUAL (MAIN OU SIDE) ================
export class Pot {
    constructor(id, level = 0) {
        this.id = id; // 'main' ou 'side-X'
        this.level = level; // 0 = main, 1+ = side pots
        this.amount = 0;
        this.playerContributions = new Map(); // playerId -> PlayerContribution
        this.eligiblePlayers = new Set(); // Jogadores elegíveis para ganhar este pote
        this.winners = []; // Jogadores que ganharam este pote
        this.isDistributed = false;
        this.isLocked = false; // Se já está bloqueado para mais apostas
        this.createdAt = new Date();
    }
    
    // Adiciona contribuição de jogador
    addPlayerContribution(playerId, amount, round = 'preflop') {
        if (this.isLocked) {
            console.warn(`⚠️ Pot ${this.id} está bloqueado, não pode receber mais apostas`);
            return 0;
        }
        
        let contribution = this.playerContributions.get(playerId);
        
        if (!contribution) {
            contribution = new PlayerContribution(playerId);
            this.playerContributions.set(playerId, contribution);
        }
        
        const newAmount = contribution.addContribution(amount, round);
        this.amount += amount;
        
        // Se o jogador contribuiu, é elegível para este pote
        if (amount > 0) {
            this.eligiblePlayers.add(playerId);
        }
        
        console.log(`💰 Pot ${this.id}: ${playerId} contribuiu ${amount} (total: ${this.amount})`);
        return newAmount;
    }
    
    // Remove jogador da elegibilidade (fold ou all-in menor)
    removeEligiblePlayer(playerId) {
        this.eligiblePlayers.delete(playerId);
        
        const contribution = this.playerContributions.get(playerId);
        if (contribution) {
            contribution.isEligible = false;
        }
        
        console.log(`🚫 ${playerId} removido da elegibilidade do pot ${this.id}`);
        return true;
    }
    
    // Verifica se jogador é elegível
    isPlayerEligible(playerId) {
        return this.eligiblePlayers.has(playerId);
    }
    
    // Obtém contribuição de um jogador
    getPlayerContribution(playerId) {
        const contribution = this.playerContributions.get(playerId);
        return contribution ? contribution.amount : 0;
    }
    
    // Obtém todos jogadores elegíveis
    getEligiblePlayers() {
        return Array.from(this.eligiblePlayers);
    }
    
    // Obtém número de jogadores elegíveis
    getEligiblePlayerCount() {
        return this.eligiblePlayers.size;
    }
    
    // Distribui pote para vencedores
    distributeToWinners(winnerPlayers, handEvaluations = {}) {
        if (this.isDistributed) {
            console.warn(`⚠️ Pot ${this.id} já foi distribuído`);
            return [];
        }
        
        if (this.amount <= 0) {
            console.warn(`⚠️ Pot ${this.id} está vazio`);
            return [];
        }
        
        if (winnerPlayers.length === 0) {
            console.warn(`⚠️ Nenhum vencedor para pot ${this.id}`);
            return [];
        }
        
        this.winners = [...winnerPlayers];
        this.isDistributed = true;
        this.isLocked = true;
        
        // Calcula quanto cada vencedor recebe
        const distribution = this.calculateDistribution(winnerPlayers, handEvaluations);
        
        // Atualiza contribuições dos vencedores
        distribution.forEach(({ playerId, amount }) => {
            const contribution = this.playerContributions.get(playerId);
            if (contribution) {
                contribution.hasWon = true;
                contribution.wonAmount = amount;
            }
        });
        
        console.log(`🏆 Pot ${this.id} distribuído: ${distribution.map(d => `${d.playerId}: ${d.amount}`).join(', ')}`);
        return distribution;
    }
    
    // Calcula distribuição do pote
    calculateDistribution(winnerPlayers, handEvaluations) {
        const distribution = [];
        const potAmount = this.amount;
        
        if (winnerPlayers.length === 1) {
            // Vencedor único leva tudo
            distribution.push({
                playerId: winnerPlayers[0],
                amount: potAmount,
                percentage: 100,
                isSoleWinner: true
            });
        } else {
            // Múltiplos vencedores (split pot)
            const winnersCount = winnerPlayers.length;
            const baseAmount = Math.floor(potAmount / winnersCount);
            const remainder = potAmount % winnersCount;
            
            winnerPlayers.forEach((playerId, index) => {
                const amount = baseAmount + (index < remainder ? 1 : 0);
                const percentage = (amount / potAmount) * 100;
                
                distribution.push({
                    playerId: playerId,
                    amount: amount,
                    percentage: percentage,
                    isSoleWinner: false,
                    handStrength: handEvaluations[playerId] || null
                });
            });
        }
        
        return distribution;
    }
    
    // Reseta o pote (para nova mão)
    reset() {
        this.amount = 0;
        this.playerContributions.clear();
        this.eligiblePlayers.clear();
        this.winners = [];
        this.isDistributed = false;
        this.isLocked = false;
        this.createdAt = new Date();
    }
    
    // Serializa para JSON
    toJSON() {
        const contributions = {};
        this.playerContributions.forEach((value, key) => {
            contributions[key] = value.toJSON();
        });
        
        return {
            id: this.id,
            level: this.level,
            amount: this.amount,
            contributions: contributions,
            eligiblePlayers: Array.from(this.eligiblePlayers),
            winners: this.winners,
            isDistributed: this.isDistributed,
            isLocked: this.isLocked,
            createdAt: this.createdAt.toISOString(),
            eligiblePlayerCount: this.getEligiblePlayerCount(),
            averageContribution: this.getAverageContribution()
        };
    }
    
    // Estatísticas do pote
    getAverageContribution() {
        if (this.playerContributions.size === 0) return 0;
        const total = Array.from(this.playerContributions.values())
            .reduce((sum, contrib) => sum + contrib.amount, 0);
        return total / this.playerContributions.size;
    }
    
    getMaxContribution() {
        let max = 0;
        this.playerContributions.forEach(contrib => {
            if (contrib.amount > max) max = contrib.amount;
        });
        return max;
    }
    
    getMinContribution() {
        let min = Infinity;
        this.playerContributions.forEach(contrib => {
            if (contrib.amount < min && contrib.amount > 0) min = contrib.amount;
        });
        return min === Infinity ? 0 : min;
    }
    
    // Verifica se o pote está ativo (ainda recebendo apostas)
    isActive() {
        return !this.isLocked && !this.isDistributed;
    }
}

// ================ CLASSE GERENCIADOR DE POTE PRINCIPAL ================
export class PotManager {
    constructor() {
        this.mainPot = new Pot('main', 0);
        this.sidePots = []; // Array de Pot para side pots
        this.totalAmount = 0;
        this.history = []; // Histórico de potes distribuídos
        this.currentRound = 'preflop';
        this.isShowdown = false;
        this.lastDistribution = null;
    }
    
    // ================ MÉTODOS DE APOSTA ================
    
    // Adiciona aposta de jogador
    addBet(playerId, amount, playerAllInAmount = Infinity) {
        if (amount <= 0) return { added: 0, pots: [] };
        
        let remainingAmount = amount;
        const potsAffected = [];
        
        // Primeiro, adiciona ao pote principal
        const mainPotSpace = this.getPotSpaceForPlayer(playerId, this.mainPot, playerAllInAmount);
        const amountToMain = Math.min(remainingAmount, mainPotSpace);
        
        if (amountToMain > 0) {
            this.mainPot.addPlayerContribution(playerId, amountToMain, this.currentRound);
            remainingAmount -= amountToMain;
            potsAffected.push({ potId: 'main', amount: amountToMain });
        }
        
        // Depois, distribui para side pots existentes
        for (const sidePot of this.sidePots) {
            if (remainingAmount <= 0) break;
            
            const potSpace = this.getPotSpaceForPlayer(playerId, sidePot, playerAllInAmount);
            const amountToSide = Math.min(remainingAmount, potSpace);
            
            if (amountToSide > 0) {
                sidePot.addPlayerContribution(playerId, amountToSide, this.currentRound);
                remainingAmount -= amountToSide;
                potsAffected.push({ potId: sidePot.id, amount: amountToSide });
            }
        }
        
        // Se ainda sobrou dinheiro, cria novos side pots
        while (remainingAmount > 0) {
            const newSidePot = this.createNewSidePot();
            const potSpace = this.getPotSpaceForPlayer(playerId, newSidePot, playerAllInAmount);
            const amountToNewPot = Math.min(remainingAmount, potSpace);
            
            if (amountToNewPot > 0) {
                newSidePot.addPlayerContribution(playerId, amountToNewPot, this.currentRound);
                remainingAmount -= amountToNewPot;
                potsAffected.push({ potId: newSidePot.id, amount: amountToNewPot });
                this.sidePots.push(newSidePot);
            }
        }
        
        this.updateTotalAmount();
        
        console.log(`🎰 ${playerId} apostou ${amount}: ${potsAffected.map(p => `${p.potId}(${p.amount})`).join(', ')}`);
        return {
            added: amount - remainingAmount,
            pots: potsAffected,
            totalAmount: this.totalAmount
        };
    }
    
    // Calcula espaço disponível no pote para um jogador
    getPotSpaceForPlayer(playerId, pot, playerAllInAmount) {
        if (playerAllInAmount <= 0) return 0;
        
        // Obtém a maior contribuição neste pote
        let maxContribution = 0;
        pot.playerContributions.forEach(contrib => {
            if (contrib.amount > maxContribution) {
                maxContribution = contrib.amount;
            }
        });
        
        // Calcula quanto o jogador já contribuiu
        const currentContribution = pot.getPlayerContribution(playerId) || 0;
        
        // Calcula quanto pode ainda contribuir
        const spaceInPot = maxContribution - currentContribution;
        const spaceByAllIn = playerAllInAmount - currentContribution;
        
        // Retorna o menor entre: espaço no pote e limite do all-in
        return Math.min(spaceInPot, spaceByAllIn);
    }
    
    // Cria novo side pot
    createNewSidePot() {
        const sidePotNumber = this.sidePots.length + 1;
        const sidePot = new Pot(`side-${sidePotNumber}`, sidePotNumber);
        
        // Copia jogadores elegíveis do pote anterior
        let previousPot;
        if (sidePotNumber === 1) {
            previousPot = this.mainPot;
        } else {
            previousPot = this.sidePots[sidePotNumber - 2];
        }
        
        // Todos que contribuíram para o pote anterior são elegíveis para este
        previousPot.playerContributions.forEach((contrib, playerId) => {
            if (contrib.amount > 0) {
                sidePot.eligiblePlayers.add(playerId);
            }
        });
        
        console.log(`🆕 Criado side pot ${sidePot.id}`);
        return sidePot;
    }
    
    // ================ MÉTODOS DE GERENCIAMENTO DE JOGADORES ================
    
    // Jogador folda - remove de todos os potes
    playerFolds(playerId) {
        this.mainPot.removeEligiblePlayer(playerId);
        this.sidePots.forEach(pot => {
            pot.removeEligiblePlayer(playerId);
        });
        
        console.log(`🎴 ${playerId} foldou - removido de todos os potes`);
        return true;
    }
    
    // Jogador vai all-in - configura limites
    playerAllIn(playerId, allInAmount) {
        console.log(`💎 ${playerId} all-in com ${allInAmount}`);
        
        // Recalcula contribuições para garantir que não exceda all-in amount
        this.recalculateForAllIn(playerId, allInAmount);
        return true;
    }
    
    // Recalcula distribuição após all-in
    recalculateForAllIn(playerId, allInAmount) {
        let totalContributed = 0;
        
        // Calcula quanto já contribuiu no main pot
        const mainContribution = this.mainPot.getPlayerContribution(playerId);
        totalContributed += mainContribution;
        
        // Verifica e ajusta side pots
        for (const sidePot of this.sidePots) {
            const contribution = sidePot.getPlayerContribution(playerId);
            
            if (totalContributed + contribution > allInAmount) {
                // Precisa redistribuir o excesso
                const excess = (totalContributed + contribution) - allInAmount;
                
                // Remove excesso deste side pot
                // Na prática, criamos um novo side pot com o excesso
                this.handleExcessContribution(sidePot, playerId, excess);
            }
            
            totalContributed += contribution;
        }
        
        this.updateTotalAmount();
    }
    
    // Trata excesso de contribuição (quando all-in é menor que já apostado)
    handleExcessContribution(pot, playerId, excessAmount) {
        if (excessAmount <= 0) return;
        
        // Cria um novo side pot para o excesso
        const newSidePot = this.createNewSidePot();
        
        // Move o excesso para o novo pot
        // Nota: Esta é uma simplificação - na prática pode ser mais complexo
        console.log(`🔄 Movendo excesso de ${excessAmount} de ${playerId} para novo side pot`);
        
        // Aqui precisaríamos ajustar as contribuições
        // Implementação completa exigiria mais lógica
    }
    
    // ================ MÉTODOS DE DISTRIBUIÇÃO ================
    
    // Distribui todos os potes
    distributeAllPots(winningPlayersByStrength, handEvaluations = {}) {
        if (this.isShowdown) {
            console.warn('⚠️ Showdown já realizado');
            return this.lastDistribution;
        }
        
        this.isShowdown = true;
        const distribution = {
            timestamp: new Date().toISOString(),
            pots: [],
            totalDistributed: 0,
            winners: {}
        };
        
        // Ordena potes por nível (main primeiro, depois side pots)
        const allPots = [this.mainPot, ...this.sidePots];
        
        // Para cada pote, encontra os vencedores elegíveis
        for (const pot of allPots) {
            if (pot.amount <= 0) continue;
            
            // Filtra vencedores que são elegíveis para este pote
            const eligibleWinners = winningPlayersByStrength.filter(playerId => 
                pot.isPlayerEligible(playerId)
            );
            
            if (eligibleWinners.length === 0) {
                console.warn(`⚠️ Nenhum vencedor elegível para pot ${pot.id}`);
                continue;
            }
            
            // Distribui o pote
            const potDistribution = pot.distributeToWinners(eligibleWinners, handEvaluations);
            
            // Atualiza distribuição geral
            potDistribution.forEach(({ playerId, amount }) => {
                if (!distribution.winners[playerId]) {
                    distribution.winners[playerId] = 0;
                }
                distribution.winners[playerId] += amount;
                distribution.totalDistributed += amount;
            });
            
            distribution.pots.push({
                potId: pot.id,
                amount: pot.amount,
                distribution: potDistribution,
                eligibleWinners: eligibleWinners
            });
        }
        
        this.lastDistribution = distribution;
        this.saveToHistory(distribution);
        
        console.log(`🏆 Distribuição completa: ${JSON.stringify(distribution.winners)}`);
        return distribution;
    }
    
    // Salva distribuição no histórico
    saveToHistory(distribution) {
        this.history.push({
            ...distribution,
            potsCount: this.sidePots.length + 1,
            totalAmount: this.totalAmount,
            mainPotAmount: this.mainPot.amount,
            sidePotsAmount: this.sidePots.reduce((sum, pot) => sum + pot.amount, 0)
        });
        
        // Mantém apenas últimos 100 históricos
        if (this.history.length > 100) {
            this.history.shift();
        }
    }
    
    // ================ MÉTODOS DE ATUALIZAÇÃO ================
    
    // Atualiza valor total
    updateTotalAmount() {
        let total = this.mainPot.amount;
        this.sidePots.forEach(pot => {
            total += pot.amount;
        });
        this.totalAmount = total;
        return total;
    }
    
    // Muda de rodada (preflop, flop, turn, river)
    advanceRound(newRound) {
        if (!['preflop', 'flop', 'turn', 'river'].includes(newRound)) {
            throw new Error(`Rodada inválida: ${newRound}`);
        }
        
        this.currentRound = newRound;
        console.log(`🔄 Avançando para rodada: ${newRound}`);
        return this.currentRound;
    }
    
    // Reseta para nova mão
    resetForNewHand() {
        this.mainPot.reset();
        this.sidePots = [];
        this.totalAmount = 0;
        this.isShowdown = false;
        this.currentRound = 'preflop';
        this.lastDistribution = null;
        
        console.log('🔄 PotManager resetado para nova mão');
        return this;
    }
    
    // ================ MÉTODOS DE CONSULTA ================
    
    // Obtém todos os potes ativos
    getAllPots() {
        return [this.mainPot, ...this.sidePots];
    }
    
    // Obtém potes não distribuídos
    getActivePots() {
        return this.getAllPots().filter(pot => !pot.isDistributed);
    }
    
    // Obtém potes distribuídos
    getDistributedPots() {
        return this.getAllPots().filter(pot => pot.isDistributed);
    }
    
    // Obtém quantidade de side pots
    getSidePotCount() {
        return this.sidePots.length;
    }
    
    // Obtém maior pote (principal ou side)
    getLargestPot() {
        const allPots = this.getAllPots();
        if (allPots.length === 0) return null;
        
        return allPots.reduce((largest, current) => {
            return current.amount > largest.amount ? current : largest;
        });
    }
    
    // Obtém estatísticas dos potes
    getPotStats() {
        const allPots = this.getAllPots();
        
        return {
            totalPots: allPots.length,
            totalAmount: this.totalAmount,
            mainPotAmount: this.mainPot.amount,
            sidePotsCount: this.sidePots.length,
            sidePotsTotal: this.sidePots.reduce((sum, pot) => sum + pot.amount, 0),
            averagePotSize: allPots.length > 0 ? this.totalAmount / allPots.length : 0,
            largestPot: this.getLargestPot()?.amount || 0,
            smallestPot: allPots.length > 0 ? Math.min(...allPots.map(p => p.amount)) : 0,
            distributedPots: this.getDistributedPots().length,
            activePots: this.getActivePots().length,
            historyCount: this.history.length
        };
    }
    
    // Obtém contribuição total de um jogador
    getPlayerTotalContribution(playerId) {
        let total = 0;
        
        total += this.mainPot.getPlayerContribution(playerId);
        this.sidePots.forEach(pot => {
            total += pot.getPlayerContribution(playerId);
        });
        
        return total;
    }
    
    // Obtém quanto um jogador pode ganhar no máximo
    getPlayerMaxWin(playerId) {
        let maxWin = 0;
        
        // Verifica em cada pote onde o jogador é elegível
        const allPots = this.getAllPots();
        allPots.forEach(pot => {
            if (pot.isPlayerEligible(playerId)) {
                // Se for o único elegível, pode ganhar tudo
                if (pot.getEligiblePlayerCount() === 1) {
                    maxWin += pot.amount;
                } else {
                    // Divide igualmente entre elegíveis
                    maxWin += Math.floor(pot.amount / pot.getEligiblePlayerCount());
                }
            }
        });
        
        return maxWin;
    }
    
    // ================ MÉTODOS DE SERIALIZAÇÃO ================
    
    toJSON() {
        return {
            mainPot: this.mainPot.toJSON(),
            sidePots: this.sidePots.map(pot => pot.toJSON()),
            totalAmount: this.totalAmount,
            currentRound: this.currentRound,
            isShowdown: this.isShowdown,
            lastDistribution: this.lastDistribution,
            potStats: this.getPotStats(),
            historyCount: this.history.length
        };
    }
    
    static fromJSON(jsonData) {
        const manager = new PotManager();
        
        // Restaura main pot
        manager.mainPot = Object.assign(new Pot('main', 0), jsonData.mainPot);
        
        // Restaura player contributions do main pot
        manager.mainPot.playerContributions = new Map();
        Object.entries(jsonData.mainPot.contributions || {}).forEach(([playerId, contribData]) => {
            const contrib = new PlayerContribution(playerId);
            Object.assign(contrib, contribData);
            manager.mainPot.playerContributions.set(playerId, contrib);
        });
        
        // Restaura eligible players do main pot
        manager.mainPot.eligiblePlayers = new Set(jsonData.mainPot.eligiblePlayers || []);
        
        // Restaura side pots
        manager.sidePots = (jsonData.sidePots || []).map(potData => {
            const pot = new Pot(potData.id, potData.level);
            Object.assign(pot, potData);
            
            // Restaura player contributions
            pot.playerContributions = new Map();
            Object.entries(potData.contributions || {}).forEach(([playerId, contribData]) => {
                const contrib = new PlayerContribution(playerId);
                Object.assign(contrib, contribData);
                pot.playerContributions.set(playerId, contrib);
            });
            
            // Restaura eligible players
            pot.eligiblePlayers = new Set(potData.eligiblePlayers || []);
            
            return pot;
        });
        
        // Restaura outras propriedades
        manager.totalAmount = jsonData.totalAmount || 0;
        manager.currentRound = jsonData.currentRound || 'preflop';
        manager.isShowdown = jsonData.isShowdown || false;
        manager.lastDistribution = jsonData.lastDistribution || null;
        manager.history = jsonData.history || [];
        
        return manager;
    }
    
    // ================ MÉTODOS DE UTILIDADE ================
    
    // Cria um snapshot do estado atual
    createSnapshot() {
        return {
            timestamp: new Date().toISOString(),
            pots: this.getAllPots().map(pot => ({
                id: pot.id,
                amount: pot.amount,
                eligiblePlayers: Array.from(pot.eligiblePlayers),
                playerContributions: Array.from(pot.playerContributions.entries())
                    .map(([playerId, contrib]) => ({
                        playerId,
                        amount: contrib.amount,
                        isEligible: contrib.isEligible
                    }))
            })),
            totalAmount: this.totalAmount,
            currentRound: this.currentRound,
            isShowdown: this.isShowdown
        };
    }
    
    // Verifica se há apostas desiguais que criariam side pots
    checkForSidePotNeeded(players) {
        const contributions = players.map(p => ({
            playerId: p.userId,
            amount: this.getPlayerTotalContribution(p.userId),
            isAllIn: p.isAllIn,
            chips: p.chips
        }));
        
        // Encontra a maior contribuição
        const maxContribution = Math.max(...contributions.map(c => c.amount));
        
        // Verifica se alguém apostou menos e não está all-in
        const needsSidePot = contributions.some(c => 
            c.amount < maxContribution && 
            c.amount > 0 && 
            !c.isAllIn && 
            c.chips > 0
        );
        
        return {
            needsSidePot,
            maxContribution,
            contributions
        };
    }
    
    // Formata para display na interface
    getDisplayInfo() {
        const activePots = this.getActivePots();
        const potDisplay = [];
        
        // Main pot sempre primeiro
        if (this.mainPot.amount > 0) {
            potDisplay.push({
                id: 'main',
                amount: this.mainPot.amount,
                type: 'main',
                eligiblePlayers: this.mainPot.getEligiblePlayerCount(),
                isDistributed: this.mainPot.isDistributed
            });
        }
        
        // Side pots
        this.sidePots.forEach((pot, index) => {
            if (pot.amount > 0) {
                potDisplay.push({
                    id: pot.id,
                    amount: pot.amount,
                    type: 'side',
                    level: index + 1,
                    eligiblePlayers: pot.getEligiblePlayerCount(),
                    isDistributed: pot.isDistributed
                });
            }
        });
        
        return {
            pots: potDisplay,
            totalAmount: this.totalAmount,
            currentRound: this.currentRound,
            hasSidePots: this.sidePots.length > 0,
            nextAction: this.isShowdown ? 'Distribuir' : 'Aguardando apostas'
        };
    }
    
    // Simula distribuição (para testes)
    simulateDistribution(players, winners) {
        console.log('🧪 Simulando distribuição...');
        
        // Cria cópia para simulação
        const simulation = new PotManager();
        simulation.mainPot = Object.assign(new Pot('main', 0), this.mainPot.toJSON());
        
        // Simula distribuição
        const distribution = simulation.distributeAllPots(winners);
        
        console.log('📊 Resultado da simulação:', distribution);
        return distribution;
    }
}

// ================ FUNÇÕES DE UTILIDADE ================

// Calcula side pots baseado nas apostas
export function calculateSidePots(players, currentBets) {
    const sidePots = [];
    
    // Ordena jogadores por valor apostado (crescente)
    const sortedPlayers = [...players]
        .filter(p => currentBets[p.userId] > 0)
        .sort((a, b) => currentBets[a.userId] - currentBets[b.userId]);
    
    let previousLevel = 0;
    
    for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const playerBet = currentBets[player.userId];
        
        if (playerBet > previousLevel) {
            // Calcula quanto cada jogador contribui para este nível
            const levelAmount = playerBet - previousLevel;
            const potAmount = levelAmount * (sortedPlayers.length - i);
            
            // Determina jogadores elegíveis (todos que apostaram pelo menos este valor)
            const eligiblePlayers = sortedPlayers
                .slice(i)
                .map(p => p.userId);
            
            sidePots.push({
                level: i + 1,
                amount: potAmount,
                levelAmount: levelAmount,
                eligiblePlayers: eligiblePlayers,
                contributingPlayers: sortedPlayers.length - i
            });
            
            previousLevel = playerBet;
        }
    }
    
    return sidePots;
}

// Distribui pote entre vencedores
export function distributePot(potAmount, winners, handStrengths = {}) {
    if (winners.length === 0) return [];
    
    // Ordena vencedores por força da mão (se houver)
    let sortedWinners = [...winners];
    if (Object.keys(handStrengths).length > 0) {
        sortedWinners.sort((a, b) => {
            const strengthA = handStrengths[a] || 0;
            const strengthB = handStrengths[b] || 0;
            return strengthB - strengthA; // Maior força primeiro
        });
        
        // Pega apenas os vencedores com maior força
        const topStrength = handStrengths[sortedWinners[0]];
        sortedWinners = sortedWinners.filter(w => handStrengths[w] === topStrength);
    }
    
    // Distribui igualmente entre vencedores
    const winnerCount = sortedWinners.length;
    const baseAmount = Math.floor(potAmount / winnerCount);
    const remainder = potAmount % winnerCount;
    
    return sortedWinners.map((winner, index) => ({
        playerId: winner,
        amount: baseAmount + (index < remainder ? 1 : 0),
        isSplit: winnerCount > 1,
        splitCount: winnerCount
    }));
}

// Verifica se é necessário criar side pot
export function needsSidePot(players, bets) {
    const betValues = Object.values(bets).filter(b => b > 0);
    
    if (betValues.length < 2) return false;
    
    const minBet = Math.min(...betValues);
    const maxBet = Math.max(...betValues);
    
    // Se há diferença e alguém não está all-in, precisa de side pot
    return maxBet > minBet;
}

// Exporta tudo
export default {
    Pot,
    PotManager,
    calculateSidePots,
    distributePot,
    needsSidePot
};