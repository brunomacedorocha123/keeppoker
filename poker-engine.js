// poker-engine.js - Sistema COMPLETO de Texas Hold'em
// Arquivo Único - Não divide em partes - Copie TUDO

console.log('🎴 POKER ENGINE v1.0 - Sistema completo carregado');

// =============================================
// CONSTANTES GLOBAIS - HIERARQUIA COMPLETA
// =============================================
const POKER_HANDS = {
    ROYAL_FLUSH: { value: 10, name: 'Royal Flush' },
    STRAIGHT_FLUSH: { value: 9, name: 'Straight Flush' },
    FOUR_OF_A_KIND: { value: 8, name: 'Quadra' },
    FULL_HOUSE: { value: 7, name: 'Full House' },
    FLUSH: { value: 6, name: 'Flush' },
    STRAIGHT: { value: 5, name: 'Sequência' },
    THREE_OF_A_KIND: { value: 4, name: 'Trinca' },
    TWO_PAIR: { value: 3, name: 'Dois Pares' },
    ONE_PAIR: { value: 2, name: 'Par' },
    HIGH_CARD: { value: 1, name: 'Carta Alta' }
};

const SUITS = {
    HEARTS: { name: 'hearts', symbol: '♥', color: 'red' },
    DIAMONDS: { name: 'diamonds', symbol: '♦', color: 'red' },
    CLUBS: { name: 'clubs', symbol: '♣', color: 'black' },
    SPADES: { name: 'spades', symbol: '♠', color: 'black' }
};

const RANKS = {
    '2': { value: 2, symbol: '2' },
    '3': { value: 3, symbol: '3' },
    '4': { value: 4, symbol: '4' },
    '5': { value: 5, symbol: '5' },
    '6': { value: 6, symbol: '6' },
    '7': { value: 7, symbol: '7' },
    '8': { value: 8, symbol: '8' },
    '9': { value: 9, symbol: '9' },
    '10': { value: 10, symbol: '10' },
    'J': { value: 11, symbol: 'J' },
    'Q': { value: 12, symbol: 'Q' },
    'K': { value: 13, symbol: 'K' },
    'A': { value: 14, symbol: 'A' }
};

// =============================================
// CLASSE CARTA - Representação completa
// =============================================
class PokerCard {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = RANKS[rank].value;
        this.symbol = SUITS[suit].symbol;
        this.color = SUITS[suit].color;
        this.display = this.getDisplay();
        this.code = rank + suit.charAt(0).toUpperCase(); // Ex: 'AH' = Ás de Copas
    }
    
    getDisplay() {
        let rankSymbol = this.rank;
        if (this.rank === '10') rankSymbol = '10';
        if (this.rank === 'J') rankSymbol = 'J';
        if (this.rank === 'Q') rankSymbol = 'Q';
        if (this.rank === 'K') rankSymbol = 'K';
        if (this.rank === 'A') rankSymbol = 'A';
        
        return rankSymbol + this.symbol;
    }
    
    toString() {
        return this.display;
    }
    
    equals(otherCard) {
        return this.suit === otherCard.suit && this.rank === otherCard.rank;
    }
}

// =============================================
// CLASSE BARALHO - 52 cartas, embaralhamento real
// =============================================
class PokerDeck {
    constructor() {
        this.cards = [];
        this.burnedCards = [];
        this.usedCards = [];
        this.reset();
    }
    
    reset() {
        this.cards = [];
        this.burnedCards = [];
        this.usedCards = [];
        
        const suits = Object.keys(SUITS);
        const ranks = Object.keys(RANKS);
        
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new PokerCard(suit, rank));
            }
        }
        
        console.log(`🎴 Baralho criado: ${this.cards.length} cartas`);
        return this.cards;
    }
    
    // Embaralhamento Fisher-Yates (profissional)
    shuffle() {
        console.log('🔀 Embaralhando baralho...');
        let currentIndex = this.cards.length;
        
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            
            [this.cards[currentIndex], this.cards[randomIndex]] = 
            [this.cards[randomIndex], this.cards[currentIndex]];
        }
        
        console.log(`✅ Baralho embaralhado: ${this.cards.length} cartas`);
        return this.cards;
    }
    
    // Distribui N cartas
    deal(count = 1) {
        if (count > this.cards.length) {
            throw new Error(`Baralho tem apenas ${this.cards.length} cartas, tentou distribuir ${count}`);
        }
        
        const dealtCards = this.cards.splice(0, count);
        this.usedCards.push(...dealtCards);
        return dealtCards;
    }
    
    // Queima uma carta (método do dealer)
    burnCard() {
        if (this.cards.length === 0) {
            console.warn('⚠️ Nenhuma carta para queimar');
            return null;
        }
        
        const burnedCard = this.deal(1)[0];
        this.burnedCards.push(burnedCard);
        console.log(`🔥 Carta queimada: ${burnedCard.toString()}`);
        return burnedCard;
    }
    
    // Verifica cartas restantes
    remaining() {
        return this.cards.length;
    }
    
    // Restaura cartas usadas (para nova mão)
    restoreUsedCards() {
        this.cards = [...this.cards, ...this.usedCards];
        this.usedCards = [];
        this.burnedCards = [];
        this.shuffle();
    }
}

// =============================================
// CLASSE AVALIADOR DE MÃOS - HIERARQUIA COMPLETA
// =============================================
class HandEvaluator {
    constructor() {
        this.handCache = new Map();
    }
    
    // ============== MÉTODO PRINCIPAL ==============
    evaluate(hand, community) {
        const cacheKey = this.getCacheKey(hand, community);
        if (this.handCache.has(cacheKey)) {
            return this.handCache.get(cacheKey);
        }
        
        const allCards = [...hand, ...community];
        
        // Verificar cada combinação da MAIOR para MENOR
        let result = this.checkRoyalFlush(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.ROYAL_FLUSH);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkStraightFlush(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.STRAIGHT_FLUSH);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkFourOfAKind(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.FOUR_OF_A_KIND);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkFullHouse(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.FULL_HOUSE);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkFlush(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.FLUSH);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkStraight(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.STRAIGHT);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkThreeOfAKind(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.THREE_OF_A_KIND);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkTwoPair(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.TWO_PAIR);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkOnePair(allCards);
        if (result) {
            result = this.finalizeResult(result, POKER_HANDS.ONE_PAIR);
            this.handCache.set(cacheKey, result);
            return result;
        }
        
        result = this.checkHighCard(allCards);
        result = this.finalizeResult(result, POKER_HANDS.HIGH_CARD);
        this.handCache.set(cacheKey, result);
        return result;
    }
    
    // ============== VERIFICAÇÕES DE MÃOS ==============
    
    // 1. ROYAL FLUSH: 10-J-Q-K-A do mesmo naipe
    checkRoyalFlush(cards) {
        const straightFlush = this.checkStraightFlush(cards);
        if (!straightFlush) return null;
        
        const values = straightFlush.map(c => c.value).sort((a, b) => a - b);
        const hasAce = values.includes(14);
        const hasTen = values.includes(10);
        const hasKing = values.includes(13);
        
        if (hasAce && hasTen && hasKing && straightFlush.length === 5) {
            return straightFlush;
        }
        return null;
    }
    
    // 2. STRAIGHT FLUSH: 5 cartas em sequência do mesmo naipe
    checkStraightFlush(cards) {
        // Agrupar por naipe
        const suits = {};
        cards.forEach(card => {
            if (!suits[card.suit]) suits[card.suit] = [];
            suits[card.suit].push(card);
        });
        
        // Para cada naipe com pelo menos 5 cartas
        for (let suit in suits) {
            if (suits[suit].length >= 5) {
                const straight = this.checkStraight(suits[suit]);
                if (straight) {
                    return straight.slice(0, 5);
                }
            }
        }
        return null;
    }
    
    // 3. FOUR OF A KIND: 4 cartas do mesmo valor
    checkFourOfAKind(cards) {
        const groups = this.groupByValue(cards);
        
        for (let value in groups) {
            if (groups[value].length >= 4) {
                const four = groups[value].slice(0, 4);
                const remaining = cards.filter(c => c.value !== parseInt(value))
                    .sort((a, b) => b.value - a.value);
                const kicker = remaining[0];
                
                return [...four, kicker].slice(0, 5);
            }
        }
        return null;
    }
    
    // 4. FULL HOUSE: Trinca + Par
    checkFullHouse(cards) {
        const groups = this.groupByValue(cards);
        let threeOfAKind = null;
        let pair = null;
        
        // Encontrar a melhor trinca
        for (let value in groups) {
            if (groups[value].length >= 3) {
                if (!threeOfAKind || parseInt(value) > threeOfAKind.value) {
                    threeOfAKind = {
                        value: parseInt(value),
                        cards: groups[value].slice(0, 3)
                    };
                }
            }
        }
        
        if (!threeOfAKind) return null;
        
        // Encontrar o melhor par (diferente da trinca)
        for (let value in groups) {
            const numValue = parseInt(value);
            if (groups[value].length >= 2 && numValue !== threeOfAKind.value) {
                if (!pair || numValue > pair.value) {
                    pair = {
                        value: numValue,
                        cards: groups[value].slice(0, 2)
                    };
                }
            }
        }
        
        if (!pair) return null;
        
        return [...threeOfAKind.cards, ...pair.cards];
    }
    
    // 5. FLUSH: 5 cartas do mesmo naipe
    checkFlush(cards) {
        const suits = {};
        cards.forEach(card => {
            if (!suits[card.suit]) suits[card.suit] = [];
            suits[card.suit].push(card);
        });
        
        for (let suit in suits) {
            if (suits[suit].length >= 5) {
                return suits[suit]
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
            }
        }
        return null;
    }
    
    // 6. STRAIGHT: 5 cartas em sequência
    checkStraight(cards) {
        // Remover duplicatas e ordenar
        const uniqueCards = [];
        const seen = new Set();
        
        cards.sort((a, b) => b.value - a.value).forEach(card => {
            if (!seen.has(card.value)) {
                seen.add(card.value);
                uniqueCards.push(card);
            }
        });
        
        // Verificar sequências normais
        for (let i = 0; i <= uniqueCards.length - 5; i++) {
            const sequence = uniqueCards.slice(i, i + 5);
            if (this.isConsecutive(sequence.map(c => c.value))) {
                return sequence;
            }
        }
        
        // Verificar sequência baixa: A-2-3-4-5
        const hasAce = uniqueCards.some(c => c.value === 14);
        const hasTwo = uniqueCards.some(c => c.value === 2);
        const hasThree = uniqueCards.some(c => c.value === 3);
        const hasFour = uniqueCards.some(c => c.value === 4);
        const hasFive = uniqueCards.some(c => c.value === 5);
        
        if (hasAce && hasTwo && hasThree && hasFour && hasFive) {
            const lowStraight = [
                uniqueCards.find(c => c.value === 14),
                uniqueCards.find(c => c.value === 5),
                uniqueCards.find(c => c.value === 4),
                uniqueCards.find(c => c.value === 3),
                uniqueCards.find(c => c.value === 2)
            ];
            return lowStraight.filter(c => c !== undefined);
        }
        
        return null;
    }
    
    // 7. THREE OF A KIND: 3 cartas do mesmo valor
    checkThreeOfAKind(cards) {
        const groups = this.groupByValue(cards);
        
        for (let value in groups) {
            if (groups[value].length >= 3) {
                const three = groups[value].slice(0, 3);
                const remaining = cards.filter(c => c.value !== parseInt(value))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 2);
                
                return [...three, ...remaining];
            }
        }
        return null;
    }
    
    // 8. TWO PAIR: Dois pares diferentes
    checkTwoPair(cards) {
        const groups = this.groupByValue(cards);
        const pairs = [];
        
        for (let value in groups) {
            if (groups[value].length >= 2) {
                pairs.push({
                    value: parseInt(value),
                    cards: groups[value].slice(0, 2)
                });
            }
        }
        
        if (pairs.length >= 2) {
            // Ordenar pares do maior para menor
            pairs.sort((a, b) => b.value - a.value);
            const bestPairs = pairs.slice(0, 2);
            
            // Encontrar kicker (melhor carta não usada)
            const usedValues = bestPairs.map(p => p.value);
            const kicker = cards
                .filter(c => !usedValues.includes(c.value))
                .sort((a, b) => b.value - a.value)[0];
            
            return [...bestPairs[0].cards, ...bestPairs[1].cards, kicker].slice(0, 5);
        }
        
        return null;
    }
    
    // 9. ONE PAIR: Um par de cartas
    checkOnePair(cards) {
        const groups = this.groupByValue(cards);
        
        for (let value in groups) {
            if (groups[value].length >= 2) {
                const pair = groups[value].slice(0, 2);
                const remaining = cards.filter(c => c.value !== parseInt(value))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3);
                
                return [...pair, ...remaining];
            }
        }
        return null;
    }
    
    // 10. HIGH CARD: Nenhuma combinação
    checkHighCard(cards) {
        return cards
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }
    
    // ============== MÉTODOS AUXILIARES ==============
    
    groupByValue(cards) {
        const groups = {};
        cards.forEach(card => {
            if (!groups[card.value]) groups[card.value] = [];
            groups[card.value].push(card);
        });
        return groups;
    }
    
    isConsecutive(values) {
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i] - 1 !== values[i + 1]) {
                return false;
            }
        }
        return true;
    }
    
    getCacheKey(hand, community) {
        const handStr = hand.map(c => c.code).sort().join('');
        const commStr = community.map(c => c.code).sort().join('');
        return handStr + '|' + commStr;
    }
    
    finalizeResult(cards, handType) {
        return {
            cards: cards.slice(0, 5),
            hand: handType.name,
            rank: handType.value,
            value: this.calculateHandValue(cards, handType.value),
            description: this.getHandDescription(cards, handType.name)
        };
    }
    
    calculateHandValue(cards, handRank) {
        let value = handRank * 1000000;
        cards.sort((a, b) => b.value - a.value);
        
        for (let i = 0; i < cards.length; i++) {
            value += cards[i].value * Math.pow(14, 4 - i);
        }
        
        return value;
    }
    
    getHandDescription(cards, handName) {
        const cardNames = cards.map(c => c.display).join(' ');
        return `${handName}: ${cardNames}`;
    }
    
    // COMPARAÇÃO DE MÃOS (para determinar vencedor)
    compareHands(hand1, hand2) {
        if (hand1.rank !== hand2.rank) {
            return hand1.rank > hand2.rank ? 1 : -1;
        }
        
        if (hand1.value !== hand2.value) {
            return hand1.value > hand2.value ? 1 : -1;
        }
        
        // Desempate detalhado
        const cards1 = hand1.cards.sort((a, b) => b.value - a.value);
        const cards2 = hand2.cards.sort((a, b) => b.value - a.value);
        
        for (let i = 0; i < Math.min(cards1.length, cards2.length); i++) {
            if (cards1[i].value !== cards2[i].value) {
                return cards1[i].value > cards2[i].value ? 1 : -1;
            }
        }
        
        return 0; // Empate exato
    }
}

// =============================================
// CLASSE DEALER - Distribuição realista
// =============================================
class PokerDealer {
    constructor(players, dealerPosition = 0) {
        this.players = players; // Array com {userId, nickname, chips, position}
        this.dealerPosition = dealerPosition;
        this.deck = new PokerDeck();
        this.communityCards = [];
        this.burnedCards = [];
        this.pot = 0;
        this.currentRound = 'preflop'; // preflop, flop, turn, river, showdown
        this.handEvaluator = new HandEvaluator();
        this.handHistory = [];
        
        console.log('👨‍💼 Dealer criado para', players.length, 'jogadores');
    }
    
    // ============== INICIAR NOVA MÃO ==============
    async startNewHand() {
        console.log('🃏 ===== NOVA MÃO =====');
        
        // 1. Resetar estado
        this.communityCards = [];
        this.burnedCards = [];
        this.pot = 0;
        
        // 2. Embaralhar baralho
        this.deck.reset();
        this.deck.shuffle();
        
        // 3. Distribuir cartas PRIVADAS (2 para cada jogador ativo)
        await this.dealPrivateCards();
        
        // 4. Aplicar blinds
        this.applyBlinds();
        
        // 5. Iniciar rodada PRE-FLOP
        this.currentRound = 'preflop';
        
        return {
            players: this.players,
            communityCards: this.communityCards,
            pot: this.pot,
            round: this.currentRound,
            dealerPosition: this.dealerPosition
        };
    }
    
    // ============== DISTRIBUIÇÃO REALISTA ==============
    async dealPrivateCards() {
        console.log('🎴 Distribuindo cartas privadas...');
        
        // Ordem: Começa no Small Blind (dealer + 1)
        const startPos = (this.dealerPosition + 1) % this.players.length;
        
        // PRIMEIRA CARTA (uma para cada jogador ativo)
        for (let i = 0; i < this.players.length; i++) {
            const playerIdx = (startPos + i) % this.players.length;
            const player = this.players[playerIdx];
            
            if (player.isActive && player.chips > 0) {
                const card = this.deck.deal(1)[0];
                player.cards = player.cards || [];
                player.cards.push(card);
                player.bet = 0;
                player.lastAction = null;
                
                console.log(`📥 1ª carta para ${player.nickname}: ${card.toString()}`);
                await this.delay(50); // Pequeno delay para realismo
            }
        }
        
        // SEGUNDA CARTA
        for (let i = 0; i < this.players.length; i++) {
            const playerIdx = (startPos + i) % this.players.length;
            const player = this.players[playerIdx];
            
            if (player.isActive && player.chips > 0 && player.cards?.length === 1) {
                const card = this.deck.deal(1)[0];
                player.cards.push(card);
                
                console.log(`📥 2ª carta para ${player.nickname}: ${card.toString()}`);
                console.log(`   ${player.nickname} tem: ${player.cards[0].toString()} ${player.cards[1].toString()}`);
                await this.delay(50);
            }
        }
        
        console.log('✅ Cartas privadas distribuídas');
    }
        // ============== APLICAR BLINDS ==============
    applyBlinds() {
        const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
        const bigBlindPos = (this.dealerPosition + 2) % this.players.length;
        
        const smallBlind = 50;
        const bigBlind = 100;
        
        // SMALL BLIND
        const sbPlayer = this.players[smallBlindPos];
        if (sbPlayer && sbPlayer.isActive) {
            const blindAmount = Math.min(smallBlind, sbPlayer.chips);
            sbPlayer.bet = blindAmount;
            sbPlayer.chips -= blindAmount;
            this.pot += blindAmount;
            sbPlayer.lastAction = 'small blind';
            console.log(`💰 ${sbPlayer.nickname} paga Small Blind: ${blindAmount}`);
        }
        
        // BIG BLIND
        const bbPlayer = this.players[bigBlindPos];
        if (bbPlayer && bbPlayer.isActive) {
            const blindAmount = Math.min(bigBlind, bbPlayer.chips);
            bbPlayer.bet = blindAmount;
            bbPlayer.chips -= blindAmount;
            this.pot += blindAmount;
            bbPlayer.lastAction = 'big blind';
            console.log(`💰 ${bbPlayer.nickname} paga Big Blind: ${blindAmount}`);
        }
        
        console.log(`💰 Pote inicial: ${this.pot}`);
    }
    
    // ============== VIRAR CARTAS COMUNITÁRIAS ==============
    
    async dealFlop() {
        console.log('🃏 ===== VIRANDO FLOP =====');
        
        // 1. QUEIMAR uma carta
        this.deck.burnCard();
        
        // 2. VIRAR 3 cartas
        this.communityCards = this.deck.deal(3);
        this.currentRound = 'flop';
        
        console.log(`🔥 Carta queimada antes do flop`);
        console.log(`📊 FLOP: ${this.communityCards.map(c => c.toString()).join(' ')}`);
        
        return {
            communityCards: this.communityCards,
            round: this.currentRound,
            pot: this.pot
        };
    }
    
    async dealTurn() {
        console.log('🃏 ===== VIRANDO TURN =====');
        
        // 1. QUEIMAR uma carta
        this.deck.burnCard();
        
        // 2. VIRAR 1 carta
        const turnCard = this.deck.deal(1)[0];
        this.communityCards.push(turnCard);
        this.currentRound = 'turn';
        
        console.log(`🔥 Carta queimada antes do turn`);
        console.log(`📊 TURN: ${turnCard.toString()}`);
        console.log(`📊 Mesa: ${this.communityCards.map(c => c.toString()).join(' ')}`);
        
        return {
            communityCards: this.communityCards,
            round: this.currentRound,
            pot: this.pot
        };
    }
    
    async dealRiver() {
        console.log('🃏 ===== VIRANDO RIVER =====');
        
        // 1. QUEIMAR uma carta
        this.deck.burnCard();
        
        // 2. VIRAR 1 carta
        const riverCard = this.deck.deal(1)[0];
        this.communityCards.push(riverCard);
        this.currentRound = 'river';
        
        console.log(`🔥 Carta queimada antes do river`);
        console.log(`📊 RIVER: ${riverCard.toString()}`);
        console.log(`📊 Mesa completa: ${this.communityCards.map(c => c.toString()).join(' ')}`);
        
        return {
            communityCards: this.communityCards,
            round: this.currentRound,
            pot: this.pot
        };
    }
    
    // ============== PROCESSAR AÇÕES DOS JOGADORES ==============
    processPlayerAction(playerId, action, amount = 0) {
        const player = this.players.find(p => p.userId === playerId);
        if (!player || !player.isActive) {
            throw new Error('Jogador não encontrado ou inativo');
        }
        
        const maxBet = this.getCurrentMaxBet();
        const playerBet = player.bet || 0;
        const playerChips = player.chips || 0;
        
        console.log(`🎮 ${player.nickname} ação: ${action} ${amount > 0 ? amount : ''}`);
        
        switch (action.toLowerCase()) {
            case 'fold':
                player.isActive = false;
                player.lastAction = 'fold';
                player.cards = []; // Esconder cartas
                console.log(`❌ ${player.nickname} desistiu`);
                break;
                
            case 'check':
                if (playerBet < maxBet) {
                    throw new Error('Não pode dar check com aposta para igualar');
                }
                player.lastAction = 'check';
                console.log(`✓ ${player.nickname} deu check`);
                break;
                
            case 'call':
                const callAmount = Math.max(0, maxBet - playerBet);
                if (callAmount > playerChips) {
                    throw new Error('Fichas insuficientes para call');
                }
                player.bet += callAmount;
                player.chips -= callAmount;
                this.pot += callAmount;
                player.lastAction = 'call';
                console.log(`📞 ${player.nickname} igualou ${callAmount}`);
                break;
                
            case 'bet':
            case 'raise':
                if (amount <= 0) {
                    throw new Error('Valor de aposta inválido');
                }
                if (amount > playerChips) {
                    throw new Error('Fichas insuficientes');
                }
                if (action === 'raise' && amount <= maxBet) {
                    throw new Error('Raise deve ser maior que a aposta atual');
                }
                
                const totalBet = playerBet + amount;
                player.bet = totalBet;
                player.chips -= amount;
                this.pot += amount;
                player.lastAction = action === 'bet' ? 'bet' : 'raise';
                console.log(`🎯 ${player.nickname} ${action === 'bet' ? 'apostou' : 'aumentou'} ${amount}`);
                break;
                
            case 'allin':
                const allinAmount = playerChips;
                player.bet += allinAmount;
                player.chips = 0;
                this.pot += allinAmount;
                player.lastAction = 'allin';
                player.isAllIn = true;
                console.log(`🔥 ${player.nickname} foi all-in com ${allinAmount}`);
                break;
                
            default:
                throw new Error(`Ação inválida: ${action}`);
        }
        
        // Registrar ação no histórico
        this.handHistory.push({
            playerId: playerId,
            playerName: player.nickname,
            action: action,
            amount: amount,
            round: this.currentRound,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            player: player,
            pot: this.pot,
            action: action,
            amount: amount
        };
    }
    
    // ============== DETERMINAR VENCEDORES ==============
    determineWinners() {
        console.log('🏆 ===== SHOWDOWN =====');
        
        const activePlayers = this.players.filter(p => 
            p.isActive && p.cards && p.cards.length === 2
        );
        
        if (activePlayers.length === 0) {
            console.log('❌ Nenhum jogador ativo no showdown');
            return [];
        }
        
        if (activePlayers.length === 1) {
            // Apenas um jogador ativo - ele ganha tudo
            const winner = activePlayers[0];
            console.log(`🎉 ${winner.nickname} ganha ${this.pot} (único ativo)`);
            
            return [{
                player: winner,
                hand: { hand: 'Vencedor único', rank: 0 },
                prize: this.pot,
                isSoleWinner: true
            }];
        }
        
        // AVALIAR MÃOS DE TODOS OS JOGADORES ATIVOS
        const evaluatedHands = activePlayers.map(player => {
            const evaluation = this.handEvaluator.evaluate(player.cards, this.communityCards);
            return {
                player: player,
                evaluation: evaluation,
                handName: evaluation.hand,
                handValue: evaluation.value,
                cards: evaluation.cards
            };
        });
        
        // ORDENAR DO MELHOR PARA O PIOR
        evaluatedHands.sort((a, b) => {
            return this.handEvaluator.compareHands(a.evaluation, b.evaluation) * -1;
        });
        
        // IDENTIFICAR VENCEDORES (pode haver empate)
        const winners = [evaluatedHands[0]];
        for (let i = 1; i < evaluatedHands.length; i++) {
            if (this.handEvaluator.compareHands(evaluatedHands[i].evaluation, evaluatedHands[0].evaluation) === 0) {
                winners.push(evaluatedHands[i]);
            } else {
                break;
            }
        }
        
        // DIVIDIR O POTE
        const prizePerWinner = Math.floor(this.pot / winners.length);
        const remainder = this.pot % winners.length;
        
        // LOG DOS RESULTADOS
        console.log('\n📊 RESULTADOS:');
        evaluatedHands.forEach((hand, index) => {
            console.log(`${index + 1}. ${hand.player.nickname}: ${hand.handName} (${hand.cards.map(c => c.toString()).join(' ')})`);
        });
        
        console.log(`\n🏆 VENCEDOR(ES):`);
        winners.forEach((winner, index) => {
            const prize = prizePerWinner + (index < remainder ? 1 : 0);
            console.log(`   ${winner.player.nickname}: ${winner.handName} - Ganha ${prize}`);
        });
        
        // RETORNAR VENCEDORES COM PRÊMIOS
        return winners.map((winner, index) => {
            const prize = prizePerWinner + (index < remainder ? 1 : 0);
            return {
                player: winner.player,
                hand: winner.evaluation,
                prize: prize,
                isSoleWinner: winners.length === 1
            };
        });
    }
    
    // ============== MÉTODOS AUXILIARES ==============
    
    getCurrentMaxBet() {
        return Math.max(...this.players.map(p => p.bet || 0));
    }
    
    getActivePlayers() {
        return this.players.filter(p => p.isActive);
    }
    
    getPlayerPosition(playerId) {
        const player = this.players.find(p => p.userId === playerId);
        return player ? player.position : -1;
    }
    
    getNextPlayer(currentPlayerId) {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length === 0) return null;
        
        const currentIndex = activePlayers.findIndex(p => p.userId === currentPlayerId);
        if (currentIndex === -1) return activePlayers[0];
        
        const nextIndex = (currentIndex + 1) % activePlayers.length;
        return activePlayers[nextIndex];
    }
    
    getGameState() {
        return {
            players: this.players.map(p => ({
                userId: p.userId,
                nickname: p.nickname,
                chips: p.chips,
                bet: p.bet,
                isActive: p.isActive,
                lastAction: p.lastAction,
                cards: p.cards ? p.cards.map(c => c.toString()) : []
            })),
            communityCards: this.communityCards.map(c => c.toString()),
            pot: this.pot,
            round: this.currentRound,
            dealerPosition: this.dealerPosition,
            activePlayers: this.getActivePlayers().length,
            remainingCards: this.deck.remaining()
        };
    }
    
    resetForNewHand() {
        // Limpar cartas dos jogadores
        this.players.forEach(player => {
            player.cards = [];
            player.bet = 0;
            player.lastAction = null;
            player.isAllIn = false;
            // Manter isActive como está (folded players continuam folded)
        });
        
        // Limpar mesa
        this.communityCards = [];
        this.burnedCards = [];
        this.pot = 0;
        this.handHistory = [];
        
        // Mover dealer para próxima posição
        this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
        
        // Resetar baralho
        this.deck.restoreUsedCards();
        this.currentRound = 'preflop';
        
        console.log(`🔄 Nova mão - Dealer na posição ${this.dealerPosition}`);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// =============================================
// CLASSE PRINCIPAL DO MOTOR DE POKER
// =============================================
class PokerGameEngine {
    constructor(tournamentId) {
        this.tournamentId = tournamentId;
        this.dealer = null;
        this.evaluator = new HandEvaluator();
        this.gameState = 'waiting'; // waiting, active, finished
        this.handNumber = 0;
        this.blindLevel = 1;
        this.blindStructure = [
            { level: 1, small: 50, big: 100, ante: 0, duration: 10 },
            { level: 2, small: 100, big: 200, ante: 0, duration: 10 },
            { level: 3, small: 150, big: 300, ante: 0, duration: 10 },
            { level: 4, small: 200, big: 400, ante: 25, duration: 10 },
            { level: 5, small: 300, big: 600, ante: 50, duration: 10 }
        ];
    }
    
    // Inicializar jogo com jogadores
    initialize(players) {
        console.log('🎮 Inicializando jogo de poker...');
        
        // Validar jogadores
        if (!players || players.length < 2) {
            throw new Error('São necessários pelo menos 2 jogadores');
        }
        
        // Preparar jogadores
        const preparedPlayers = players.map((player, index) => ({
            ...player,
            position: index,
            chips: player.chips || 1500,
            isActive: true,
            cards: [],
            bet: 0,
            lastAction: null
        }));
        
        // Criar dealer
        this.dealer = new PokerDealer(preparedPlayers, 0);
        this.gameState = 'active';
        this.handNumber = 1;
        
        console.log(`✅ Jogo inicializado com ${preparedPlayers.length} jogadores`);
        return this.dealer.getGameState();
    }
    
    // Iniciar nova mão
    async startHand() {
        if (this.gameState !== 'active') {
            throw new Error('Jogo não está ativo');
        }
        
        if (this.dealer.getActivePlayers().length < 2) {
            throw new Error('Não há jogadores suficientes para nova mão');
        }
        
        this.handNumber++;
        console.log(`\n🃏🃏🃏 MÃO #${this.handNumber} 🃏🃏🃏`);
        
        const handResult = await this.dealer.startNewHand();
        
        return {
            ...handResult,
            handNumber: this.handNumber,
            blindLevel: this.blindLevel,
            blinds: this.getCurrentBlinds()
        };
    }
    
    // Processar ação do jogador
    playerAction(playerId, action, amount = 0) {
        if (!this.dealer) {
            throw new Error('Jogo não inicializado');
        }
        
        try {
            const result = this.dealer.processPlayerAction(playerId, action, amount);
            
            // Verificar se rodada terminou
            if (this.isRoundComplete()) {
                console.log(`✅ Rodada ${this.dealer.currentRound} completa`);
                this.advanceRound();
            }
            
            return {
                success: true,
                ...result,
                gameState: this.dealer.getGameState()
            };
        } catch (error) {
            console.error('❌ Erro na ação:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Avançar rodada (flop, turn, river)
    async advanceRound() {
        switch (this.dealer.currentRound) {
            case 'preflop':
                console.log('⏭️ Avançando para FLOP');
                return await this.dealer.dealFlop();
                
            case 'flop':
                console.log('⏭️ Avançando para TURN');
                return await this.dealer.dealTurn();
                
            case 'turn':
                console.log('⏭️ Avançando para RIVER');
                return await this.dealer.dealRiver();
                
            case 'river':
                console.log('⏭️ Avançando para SHOWDOWN');
                const winners = this.dealer.determineWinners();
                
                // Distribuir prêmios
                this.distributePrizes(winners);
                
                // Preparar próxima mão
                this.dealer.resetForNewHand();
                
                return {
                    round: 'showdown',
                    winners: winners,
                    potDistributed: true,
                    nextHandReady: true
                };
                
            default:
                return null;
        }
    }

        // ============== DISTRIBUIÇÃO DE PRÊMIOS ==============
    distributePrizes(winners) {
        if (!winners || winners.length === 0) {
            console.log('⚠️ Nenhum vencedor para distribuir prêmios');
            return;
        }
        
        winners.forEach(winner => {
            const player = this.dealer.players.find(p => p.userId === winner.player.userId);
            if (player) {
                player.chips += winner.prize;
                console.log(`💰 ${player.nickname} recebe ${winner.prize} fichas`);
            }
        });
        
        // Verificar se algum jogador ficou com 0 fichas
        const eliminatedPlayers = this.dealer.players.filter(p => p.chips <= 0 && p.isActive);
        eliminatedPlayers.forEach(player => {
            player.isActive = false;
            console.log(`💀 ${player.nickname} foi eliminado do torneio`);
        });
        
        // Atualizar estado do jogo
        const activePlayers = this.dealer.getActivePlayers();
        if (activePlayers.length === 1) {
            this.gameState = 'finished';
            console.log(`🏆🏆🏆 ${activePlayers[0].nickname} VENCEU O TORNEIO! 🏆🏆🏆`);
        }
    }
    
    // ============== VERIFICAÇÕES DE RODADA ==============
    isRoundComplete() {
        const activePlayers = this.dealer.getActivePlayers();
        
        // Se apenas um jogador ativo, rodada termina
        if (activePlayers.length <= 1) {
            return true;
        }
        
        // Todos os jogadores ativos devem ter apostas iguais
        const maxBet = this.dealer.getCurrentMaxBet();
        const allBetsEqual = activePlayers.every(p => (p.bet || 0) === maxBet);
        
        // E todos devem ter feito uma ação nesta rodada
        const allActed = activePlayers.every(p => p.lastAction !== null);
        
        return allBetsEqual && allActed;
    }
    
    // ============== CONTROLE DE BLINDS ==============
    getCurrentBlinds() {
        const currentLevel = Math.min(this.blindLevel, this.blindStructure.length);
        const blindInfo = this.blindStructure[currentLevel - 1];
        
        return {
            smallBlind: blindInfo.small,
            bigBlind: blindInfo.big,
            ante: blindInfo.ante,
            level: currentLevel
        };
    }
    
    increaseBlindLevel() {
        if (this.blindLevel < this.blindStructure.length) {
            this.blindLevel++;
            const newBlinds = this.getCurrentBlinds();
            console.log(`📈 Nível de blinds aumentado: ${newBlinds.smallBlind}/${newBlinds.bigBlind}`);
            return newBlinds;
        }
        return this.getCurrentBlinds();
    }
    
    // ============== GERENCIAMENTO DE JOGADORES ==============
    addPlayer(player) {
        if (!this.dealer) {
            throw new Error('Jogo não inicializado');
        }
        
        const newPlayer = {
            ...player,
            position: this.dealer.players.length,
            chips: player.chips || 1500,
            isActive: true,
            cards: [],
            bet: 0,
            lastAction: null
        };
        
        this.dealer.players.push(newPlayer);
        console.log(`👤 ${player.nickname} entrou no jogo`);
        
        return newPlayer;
    }
    
    removePlayer(playerId) {
        if (!this.dealer) return false;
        
        const playerIndex = this.dealer.players.findIndex(p => p.userId === playerId);
        if (playerIndex === -1) return false;
        
        const player = this.dealer.players[playerIndex];
        console.log(`👋 ${player.nickname} saiu do jogo`);
        
        // Se for o dealer, mover posição
        if (this.dealer.dealerPosition >= playerIndex) {
            this.dealer.dealerPosition = Math.max(0, this.dealer.dealerPosition - 1);
        }
        
        this.dealer.players.splice(playerIndex, 1);
        
        // Atualizar posições dos jogadores restantes
        this.dealer.players.forEach((p, idx) => {
            p.position = idx;
        });
        
        return true;
    }
    
    // ============== ESTADO DO JOGO ==============
    getGameInfo() {
        if (!this.dealer) {
            return { gameState: 'not_initialized' };
        }
        
        const state = this.dealer.getGameState();
        const blinds = this.getCurrentBlinds();
        
        return {
            ...state,
            handNumber: this.handNumber,
            blindLevel: this.blindLevel,
            smallBlind: blinds.smallBlind,
            bigBlind: blinds.bigBlind,
            ante: blinds.ante,
            gameState: this.gameState,
            activePlayers: this.dealer.getActivePlayers().length,
            totalPlayers: this.dealer.players.length
        };
    }
    
    getPlayerInfo(playerId) {
        if (!this.dealer) return null;
        
        const player = this.dealer.players.find(p => p.userId === playerId);
        if (!player) return null;
        
        return {
            ...player,
            cards: player.cards ? player.cards.map(c => c.toString()) : [],
            handEvaluation: player.cards && player.cards.length === 2 && this.dealer.communityCards.length > 0 
                ? this.evaluator.evaluate(player.cards, this.dealer.communityCards)
                : null
        };
    }
    
    // ============== UTILITÁRIOS ==============
    simulateHand(players = 6) {
        console.log('🤖 Simulando mão de poker...');
        
        // Criar jogadores fictícios para teste
        const testPlayers = Array.from({ length: players }, (_, i) => ({
            userId: `test_${i}`,
            nickname: `Jogador ${i + 1}`,
            chips: 1500,
            position: i,
            isActive: true
        }));
        
        // Inicializar jogo
        this.initialize(testPlayers);
        
        // Iniciar mão
        this.startHand().then(() => {
            console.log('✅ Simulação completa');
            console.log('Estado do jogo:', this.getGameInfo());
        });
        
        return this.getGameInfo();
    }
    
    // ============== EXPORTAÇÃO DE DADOS ==============
    exportHandHistory() {
        return {
            tournamentId: this.tournamentId,
            handNumber: this.handNumber,
            players: this.dealer.players.map(p => ({
                userId: p.userId,
                nickname: p.nickname,
                finalChips: p.chips,
                position: p.position
            })),
            communityCards: this.dealer.communityCards.map(c => c.toString()),
            pot: this.dealer.pot,
            handHistory: this.dealer.handHistory,
            timestamp: new Date().toISOString()
        };
    }
}

// =============================================
// FUNÇÕES GLOBAIS PARA FACILITAR USO
// =============================================

// Instância global do motor (opcional)
let globalPokerGame = null;

// Inicializar novo jogo
function createPokerGame(tournamentId, players) {
    globalPokerGame = new PokerGameEngine(tournamentId);
    return globalPokerGame.initialize(players);
}

// Obter instância atual
function getPokerGame() {
    return globalPokerGame;
}

// Função para testar avaliação de mãos
function testHandEvaluation(handCards, communityCards) {
    const evaluator = new HandEvaluator();
    
    // Converter strings para objetos Card
    const parseCard = (str) => {
        const rank = str.slice(0, -1);
        const suitSymbol = str.slice(-1);
        
        let suit;
        switch(suitSymbol) {
            case '♥': suit = 'hearts'; break;
            case '♦': suit = 'diamonds'; break;
            case '♣': suit = 'clubs'; break;
            case '♠': suit = 'spades'; break;
            default: suit = 'hearts';
        }
        
        return new PokerCard(suit, rank);
    };
    
    const hand = handCards.map(parseCard);
    const community = communityCards.map(parseCard);
    
    return evaluator.evaluate(hand, community);
}

// =============================================
// EXPORTAÇÃO PARA USO EM OUTROS ARQUIVOS
// =============================================

// Para uso no navegador
if (typeof window !== 'undefined') {
    window.PokerEngine = {
        // Classes principais
        PokerGameEngine,
        PokerDealer,
        HandEvaluator,
        PokerDeck,
        PokerCard,
        
        // Instância global
        getGame: () => globalPokerGame,
        createGame: createPokerGame,
        
        // Constantes
        HAND_RANKINGS: POKER_HANDS,
        SUITS,
        RANKS,
        
        // Funções utilitárias
        testHandEvaluation,
        
        // Versão
        VERSION: '1.0.0'
    };
    
    console.log('🎴🎴🎴 POKER ENGINE v1.0.0 PRONTO PARA USO 🎴🎴🎴');
    console.log('Classes disponíveis: PokerGameEngine, PokerDealer, HandEvaluator');
    console.log('Uso: window.PokerEngine.createGame(tournamentId, players)');
}

// Para Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PokerGameEngine,
        PokerDealer,
        HandEvaluator,
        PokerDeck,
        PokerCard,
        POKER_HANDS,
        SUITS,
        RANKS,
        createPokerGame,
        getPokerGame,
        testHandEvaluation
    };
}

// =============================================
// EXEMPLOS DE USO RÁPIDO
// =============================================

// Exemplo 1: Testar uma mão específica
if (typeof window !== 'undefined' && window.location.href.includes('test')) {
    console.log('\n🃏 EXEMPLO: Testando Royal Flush');
    
    const royalFlushHand = [
        new PokerCard('hearts', '10'),
        new PokerCard('hearts', 'J')
    ];
    
    const royalFlushCommunity = [
        new PokerCard('hearts', 'Q'),
        new PokerCard('hearts', 'K'),
        new PokerCard('hearts', 'A'),
        new PokerCard('diamonds', '2'),
        new PokerCard('clubs', '7')
    ];
    
    const evaluator = new HandEvaluator();
    const result = evaluator.evaluate(royalFlushHand, royalFlushCommunity);
    console.log(`Royal Flush detectado: ${result.hand} (${result.cards.map(c => c.toString()).join(' ')})`);
}

// Exemplo 2: Testar distribuição
if (typeof window !== 'undefined' && window.location.href.includes('deal')) {
    console.log('\n🎴 EXEMPLO: Testando distribuição de cartas');
    
    const deck = new PokerDeck();
    deck.shuffle();
    
    console.log(`Cartas no baralho: ${deck.remaining()}`);
    
    const hand = deck.deal(2);
    console.log(`Mão de 2 cartas: ${hand.map(c => c.toString()).join(' ')}`);
    
    deck.burnCard();
    const flop = deck.deal(3);
    console.log(`Flop: ${flop.map(c => c.toString()).join(' ')}`);
    
    console.log(`Cartas restantes: ${deck.remaining()}`);
}

console.log('✅ poker-engine.js carregado com sucesso!');