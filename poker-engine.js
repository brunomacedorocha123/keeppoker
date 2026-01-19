// poker-engine.js - Sistema COMPLETO de Texas Hold'em
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

class PokerCard {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = RANKS[rank].value;
        this.symbol = SUITS[suit].symbol;
        this.color = SUITS[suit].color;
        this.display = rank + SUITS[suit].symbol;
    }
    
    toString() {
        return this.display;
    }
}

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
        return this.cards;
    }
    
    shuffle() {
        let currentIndex = this.cards.length;
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [this.cards[currentIndex], this.cards[randomIndex]] = 
            [this.cards[randomIndex], this.cards[currentIndex]];
        }
        return this.cards;
    }
    
    deal(count = 1) {
        if (count > this.cards.length) {
            throw new Error(`Baralho insuficiente`);
        }
        const dealtCards = this.cards.splice(0, count);
        this.usedCards.push(...dealtCards);
        return dealtCards;
    }
    
    burnCard() {
        if (this.cards.length === 0) return null;
        const burnedCard = this.deal(1)[0];
        this.burnedCards.push(burnedCard);
        return burnedCard;
    }
    
    remaining() {
        return this.cards.length;
    }
    
    restoreUsedCards() {
        this.cards = [...this.cards, ...this.usedCards];
        this.usedCards = [];
        this.burnedCards = [];
        this.shuffle();
    }
}

class HandEvaluator {
    constructor() {
        this.handCache = new Map();
    }
    
    evaluate(hand, community) {
        const cacheKey = this.getCacheKey(hand, community);
        if (this.handCache.has(cacheKey)) {
            return this.handCache.get(cacheKey);
        }
        const allCards = [...hand, ...community];
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
    
    checkStraightFlush(cards) {
        const suits = {};
        cards.forEach(card => {
            if (!suits[card.suit]) suits[card.suit] = [];
            suits[card.suit].push(card);
        });
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
    
    checkFullHouse(cards) {
        const groups = this.groupByValue(cards);
        let threeOfAKind = null;
        let pair = null;
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
    
    checkStraight(cards) {
        const uniqueCards = [];
        const seen = new Set();
        cards.sort((a, b) => b.value - a.value).forEach(card => {
            if (!seen.has(card.value)) {
                seen.add(card.value);
                uniqueCards.push(card);
            }
        });
        for (let i = 0; i <= uniqueCards.length - 5; i++) {
            const sequence = uniqueCards.slice(i, i + 5);
            if (this.isConsecutive(sequence.map(c => c.value))) {
                return sequence;
            }
        }
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
            pairs.sort((a, b) => b.value - a.value);
            const bestPairs = pairs.slice(0, 2);
            const usedValues = bestPairs.map(p => p.value);
            const kicker = cards
                .filter(c => !usedValues.includes(c.value))
                .sort((a, b) => b.value - a.value)[0];
            return [...bestPairs[0].cards, ...bestPairs[1].cards, kicker].slice(0, 5);
        }
        return null;
    }
    
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
    
    checkHighCard(cards) {
        return cards
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }
    
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
        const handStr = hand.map(c => c.rank + c.suit).sort().join('');
        const commStr = community.map(c => c.rank + c.suit).sort().join('');
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
    
    compareHands(hand1, hand2) {
        if (hand1.rank !== hand2.rank) {
            return hand1.rank > hand2.rank ? 1 : -1;
        }
        if (hand1.value !== hand2.value) {
            return hand1.value > hand2.value ? 1 : -1;
        }
        const cards1 = hand1.cards.sort((a, b) => b.value - a.value);
        const cards2 = hand2.cards.sort((a, b) => b.value - a.value);
        for (let i = 0; i < Math.min(cards1.length, cards2.length); i++) {
            if (cards1[i].value !== cards2[i].value) {
                return cards1[i].value > cards2[i].value ? 1 : -1;
            }
        }
        return 0;
    }
}
class PokerDealer {
    constructor(players, dealerPosition = 0) {
        this.players = players;
        this.dealerPosition = dealerPosition;
        this.deck = new PokerDeck();
        this.communityCards = [];
        this.burnedCards = [];
        this.pot = 0;
        this.currentRound = 'preflop';
        this.handEvaluator = new HandEvaluator();
        this.handHistory = [];
        this.smallBlind = 50;
        this.bigBlind = 100;
        this.currentMaxBet = 0;
        this.bettingRoundActive = true;
    }
    
    startNewHand() {
        this.communityCards = [];
        this.burnedCards = [];
        this.pot = 0;
        this.currentMaxBet = 0;
        this.bettingRoundActive = true;
        this.deck.reset();
        this.deck.shuffle();
        this.dealPrivateCards();
        this.applyBlinds();
        this.currentRound = 'preflop';
        return this.getGameState();
    }
    
    dealPrivateCards() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player.isActive && player.chips > 0) {
                player.cards = [];
                player.bet = 0;
                player.lastAction = null;
                player.isAllIn = false;
                player.hasActedThisRound = false;
            }
        }
        
        const startPos = (this.dealerPosition + 1) % this.players.length;
        
        for (let cardNum = 0; cardNum < 2; cardNum++) {
            for (let i = 0; i < this.players.length; i++) {
                const playerIdx = (startPos + i) % this.players.length;
                const player = this.players[playerIdx];
                if (player.isActive && player.chips > 0) {
                    const card = this.deck.deal(1)[0];
                    player.cards.push(card);
                }
            }
        }
    }
    
    applyBlinds() {
        const smallBlindPos = (this.dealerPosition + 1) % this.players.length;
        const bigBlindPos = (this.dealerPosition + 2) % this.players.length;
        
        const sbPlayer = this.players[smallBlindPos];
        if (sbPlayer && sbPlayer.isActive) {
            const blindAmount = Math.min(this.smallBlind, sbPlayer.chips);
            sbPlayer.bet = blindAmount;
            sbPlayer.chips -= blindAmount;
            this.pot += blindAmount;
            sbPlayer.lastAction = 'small blind';
            sbPlayer.hasActedThisRound = true;
            this.currentMaxBet = Math.max(this.currentMaxBet, blindAmount);
        }
        
        const bbPlayer = this.players[bigBlindPos];
        if (bbPlayer && bbPlayer.isActive) {
            const blindAmount = Math.min(this.bigBlind, bbPlayer.chips);
            bbPlayer.bet = blindAmount;
            bbPlayer.chips -= blindAmount;
            this.pot += blindAmount;
            bbPlayer.lastAction = 'big blind';
            bbPlayer.hasActedThisRound = true;
            this.currentMaxBet = Math.max(this.currentMaxBet, blindAmount);
        }
    }
    
    dealFlop() {
        this.deck.burnCard();
        const flopCards = this.deck.deal(3);
        this.communityCards = [...flopCards];
        this.currentRound = 'flop';
        this.resetPlayerActionsForNewRound();
        this.currentMaxBet = 0;
        return {
            communityCards: this.communityCards,
            round: this.currentRound,
            pot: this.pot
        };
    }
    
    dealTurn() {
        this.deck.burnCard();
        const turnCard = this.deck.deal(1)[0];
        this.communityCards.push(turnCard);
        this.currentRound = 'turn';
        this.resetPlayerActionsForNewRound();
        this.currentMaxBet = 0;
        return {
            communityCards: this.communityCards,
            round: this.currentRound,
            pot: this.pot
        };
    }
    
    dealRiver() {
        this.deck.burnCard();
        const riverCard = this.deck.deal(1)[0];
        this.communityCards.push(riverCard);
        this.currentRound = 'river';
        this.resetPlayerActionsForNewRound();
        this.currentMaxBet = 0;
        return {
            communityCards: this.communityCards,
            round: this.currentRound,
            pot: this.pot
        };
    }
    
    resetPlayerActionsForNewRound() {
        this.players.forEach(player => {
            if (player.isActive && player.lastAction !== 'fold') {
                player.lastAction = null;
                player.bet = 0;
                player.hasActedThisRound = false;
            }
        });
    }
    
    processPlayerAction(playerId, action, amount = 0) {
        const player = this.players.find(p => p.userId === playerId);
        if (!player || !player.isActive) {
            throw new Error('Jogador não encontrado ou inativo');
        }
        
        const playerBet = player.bet || 0;
        const playerChips = player.chips || 0;
        
        switch (action.toLowerCase()) {
            case 'fold':
                player.isActive = false;
                player.lastAction = 'fold';
                player.cards = [];
                player.hasActedThisRound = true;
                break;
                
            case 'check':
                if (playerBet < this.currentMaxBet) {
                    throw new Error('Não pode dar check com aposta para igualar');
                }
                player.lastAction = 'check';
                player.hasActedThisRound = true;
                break;
                
            case 'call':
                const callAmount = Math.max(0, this.currentMaxBet - playerBet);
                if (callAmount > playerChips) {
                    player.lastAction = 'allin';
                    player.bet += playerChips;
                    player.chips = 0;
                    this.pot += playerChips;
                    player.isAllIn = true;
                    this.currentMaxBet = Math.max(this.currentMaxBet, player.bet);
                } else {
                    player.bet += callAmount;
                    player.chips -= callAmount;
                    this.pot += callAmount;
                    player.lastAction = 'call';
                }
                player.hasActedThisRound = true;
                break;
                
            case 'bet':
                if (amount <= 0) throw new Error('Valor de aposta inválido');
                if (amount > playerChips) throw new Error('Fichas insuficientes');
                if (this.currentMaxBet > 0) throw new Error('Não pode fazer bet quando já há apostas');
                
                player.bet = amount;
                player.chips -= amount;
                this.pot += amount;
                this.currentMaxBet = amount;
                player.lastAction = 'bet';
                player.hasActedThisRound = true;
                break;
                
            case 'raise':
                if (amount <= 0) throw new Error('Valor de raise inválido');
                if (amount > playerChips) throw new Error('Fichas insuficientes');
                if (amount <= this.currentMaxBet) throw new Error('Raise deve ser maior que a aposta atual');
                
                const totalBet = playerBet + amount;
                player.bet = totalBet;
                player.chips -= amount;
                this.pot += amount;
                this.currentMaxBet = totalBet;
                player.lastAction = 'raise';
                player.hasActedThisRound = true;
                break;
                
            case 'allin':
                const allinAmount = playerChips;
                player.bet += allinAmount;
                player.chips = 0;
                this.pot += allinAmount;
                this.currentMaxBet = Math.max(this.currentMaxBet, player.bet);
                player.lastAction = 'allin';
                player.isAllIn = true;
                player.hasActedThisRound = true;
                break;
                
            default:
                throw new Error(`Ação inválida: ${action}`);
        }
        
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
            amount: amount,
            currentMaxBet: this.currentMaxBet
        };
    }
    
    determineWinners() {
        const activePlayers = this.players.filter(p => 
            p.isActive && p.cards && p.cards.length === 2
        );
        
        if (activePlayers.length === 0) return [];
        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            return [{
                player: winner,
                hand: { hand: 'Vencedor único', rank: 0 },
                prize: this.pot,
                isSoleWinner: true
            }];
        }
        
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
        
        evaluatedHands.sort((a, b) => {
            return this.handEvaluator.compareHands(a.evaluation, b.evaluation) * -1;
        });
        
        const winners = [evaluatedHands[0]];
        for (let i = 1; i < evaluatedHands.length; i++) {
            if (this.handEvaluator.compareHands(evaluatedHands[i].evaluation, evaluatedHands[0].evaluation) === 0) {
                winners.push(evaluatedHands[i]);
            } else {
                break;
            }
        }
        
        const prizePerWinner = Math.floor(this.pot / winners.length);
        const remainder = this.pot % winners.length;
        
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
    
    isBettingRoundComplete() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length <= 1) return true;
        
        const playersWhoNeedToAct = activePlayers.filter(p => 
            !p.hasActedThisRound && 
            !p.isAllIn && 
            p.lastAction !== 'fold'
        );
        
        if (playersWhoNeedToAct.length > 0) return false;
        
        const allBetsEqualized = activePlayers.every(p => 
            p.isAllIn || 
            p.lastAction === 'fold' || 
            p.bet === this.currentMaxBet
        );
        
        return allBetsEqualized;
    }
    
    getNextPlayerToAct() {
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length <= 1) return null;
        
        const dealerIndex = this.dealerPosition;
        let startIndex;
        
        if (this.currentRound === 'preflop') {
            const bigBlindIndex = (dealerIndex + 2) % this.players.length;
            startIndex = (bigBlindIndex + 1) % this.players.length;
        } else {
            startIndex = (dealerIndex + 1) % this.players.length;
        }
        
        for (let i = 0; i < this.players.length; i++) {
            const index = (startIndex + i) % this.players.length;
            const player = this.players[index];
            
            if (player.isActive && 
                !player.hasActedThisRound && 
                !player.isAllIn && 
                player.lastAction !== 'fold' && 
                player.chips > 0) {
                return player;
            }
        }
        
        return null;
    }
    
    getActivePlayers() {
        return this.players.filter(p => p.isActive && p.chips > 0);
    }
    
    getGameState() {
        const nextPlayer = this.getNextPlayerToAct();
        return {
            players: this.players.map(p => ({
                userId: p.userId,
                nickname: p.nickname,
                chips: p.chips,
                bet: p.bet,
                isActive: p.isActive,
                lastAction: p.lastAction,
                cards: p.cards ? p.cards.map(c => c.toString()) : [],
                isAllIn: p.isAllIn || false,
                hasActedThisRound: p.hasActedThisRound || false
            })),
            communityCards: this.communityCards.map(c => c.toString()),
            pot: this.pot,
            round: this.currentRound,
            dealerPosition: this.dealerPosition,
            currentMaxBet: this.currentMaxBet,
            activePlayers: this.getActivePlayers().length,
            currentPlayerTurn: nextPlayer ? nextPlayer.userId : null,
            bettingRoundComplete: this.isBettingRoundComplete()
        };
    }
    
    resetForNewHand() {
        this.communityCards = [];
        this.burnedCards = [];
        this.pot = 0;
        this.currentMaxBet = 0;
        this.handHistory = [];
        this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
        
        this.players.forEach(player => {
            player.cards = [];
            player.bet = 0;
            player.lastAction = null;
            player.isAllIn = false;
            player.hasActedThisRound = false;
            if (player.chips <= 0) player.isActive = false;
        });
        
        this.deck.restoreUsedCards();
        this.currentRound = 'preflop';
    }
}

class PokerGameEngine {
    constructor(tournamentId) {
        this.tournamentId = tournamentId;
        this.dealer = null;
        this.evaluator = new HandEvaluator();
        this.gameState = 'waiting';
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
    
    initialize(players) {
        if (!players || players.length < 2) {
            throw new Error('São necessários pelo menos 2 jogadores');
        }
        
        const preparedPlayers = players.map((player, index) => ({
            ...player,
            position: index,
            chips: player.chips || 1500,
            isActive: true,
            cards: [],
            bet: 0,
            lastAction: null,
            isAllIn: false,
            hasActedThisRound: false
        }));
        
        this.dealer = new PokerDealer(preparedPlayers, 0);
        this.gameState = 'active';
        this.handNumber = 1;
        
        return this.dealer.getGameState();
    }
    
    startHand() {
        if (this.gameState !== 'active') {
            throw new Error('Jogo não está ativo');
        }
        
        if (this.dealer.getActivePlayers().length < 2) {
            throw new Error('Não há jogadores suficientes para nova mão');
        }
        
        this.handNumber++;
        const handResult = this.dealer.startNewHand();
        
        return {
            ...handResult,
            handNumber: this.handNumber,
            blindLevel: this.blindLevel,
            blinds: this.getCurrentBlinds()
        };
    }
    
    playerAction(playerId, action, amount = 0) {
        if (!this.dealer) {
            throw new Error('Jogo não inicializado');
        }
        
        try {
            const result = this.dealer.processPlayerAction(playerId, action, amount);
            
            return {
                success: true,
                ...result,
                gameState: this.dealer.getGameState(),
                bettingRoundComplete: this.dealer.isBettingRoundComplete(),
                nextPlayer: this.dealer.getNextPlayerToAct()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    advanceRound() {
        if (!this.dealer) return null;
        
        switch (this.dealer.currentRound) {
            case 'preflop':
                return this.dealer.dealFlop();
            case 'flop':
                return this.dealer.dealTurn();
            case 'turn':
                return this.dealer.dealRiver();
            case 'river':
                const winners = this.dealer.determineWinners();
                this.distributePrizes(winners);
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
    
    distributePrizes(winners) {
        if (!winners || winners.length === 0) return;
        
        winners.forEach(winner => {
            const player = this.dealer.players.find(p => p.userId === winner.player.userId);
            if (player) {
                player.chips += winner.prize;
            }
        });
        
        const eliminatedPlayers = this.dealer.players.filter(p => p.chips <= 0 && p.isActive);
        eliminatedPlayers.forEach(player => {
            player.isActive = false;
        });
        
        const activePlayers = this.dealer.getActivePlayers();
        if (activePlayers.length === 1) {
            this.gameState = 'finished';
        }
    }
    
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
    
    getGameInfo() {
        if (!this.dealer) return { gameState: 'not_initialized' };
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
}

if (typeof window !== 'undefined') {
    window.PokerEngine = {
        PokerGameEngine,
        PokerDealer,
        HandEvaluator,
        PokerDeck,
        PokerCard,
        HAND_RANKINGS: POKER_HANDS,
        SUITS,
        RANKS,
        VERSION: '3.0.0'
    };
}