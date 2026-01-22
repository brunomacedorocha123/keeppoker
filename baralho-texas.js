/**
 * SISTEMA COMPLETO DE BARALHO TEXAS HOLD'EM
 * Arquivo: baralho-texas.js
 * Responsável por: Cartas, baralho, embaralhamento e distribuição
 */

// ================ CONSTANTES DO JOGO ================
export const SUITS = {
    HEARTS: { name: 'hearts', symbol: '♥', color: 'red' },
    DIAMONDS: { name: 'diamonds', symbol: '♦', color: 'red' },
    CLUBS: { name: 'clubs', symbol: '♣', color: 'black' },
    SPADES: { name: 'spades', symbol: '♠', color: 'black' }
};

export const RANKS = {
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

// ================ CLASSE CARTA ================
export class PokerCard {
    constructor(suit, rank) {
        if (!SUITS[suit]) throw new Error(`Naipe inválido: ${suit}`);
        if (!RANKS[rank]) throw new Error(`Valor inválido: ${rank}`);
        
        this.suit = suit;           // Ex: 'HEARTS'
        this.rank = rank;           // Ex: 'A'
        this.value = RANKS[rank].value; // Ex: 14
        this.symbol = SUITS[suit].symbol; // Ex: '♥'
        this.color = SUITS[suit].color;   // Ex: 'red'
        this.display = rank + SUITS[suit].symbol; // Ex: 'A♥'
        this.id = `${rank}${suit.charAt(0)}`;     // Ex: 'AH' para Ace of Hearts
        this.faceUp = false;        // Se a carta está virada para cima
    }
    
    toString() {
        return this.display;
    }
    
    flip() {
        this.faceUp = !this.faceUp;
        return this;
    }
    
    isHigherThan(otherCard) {
        return this.value > otherCard.value;
    }
    
    isSameRank(otherCard) {
        return this.value === otherCard.value;
    }
    
    isSameSuit(otherCard) {
        return this.suit === otherCard.suit;
    }
    
    toJSON() {
        return {
            suit: this.suit,
            rank: this.rank,
            display: this.display,
            value: this.value,
            id: this.id,
            faceUp: this.faceUp,
            color: this.color
        };
    }
    
    static fromString(cardString) {
        const rankMatch = cardString.match(/^[0-9JQKA]+/);
        const suitMatch = cardString.match(/[♥♦♣♠]$/);
        
        if (!rankMatch || !suitMatch) {
            throw new Error(`Formato de carta inválido: ${cardString}`);
        }
        
        const rank = rankMatch[0];
        const suitSymbol = suitMatch[0];
        
        let suit;
        switch(suitSymbol) {
            case '♥': suit = 'HEARTS'; break;
            case '♦': suit = 'DIAMONDS'; break;
            case '♣': suit = 'CLUBS'; break;
            case '♠': suit = 'SPADES'; break;
            default: throw new Error(`Símbolo inválido: ${suitSymbol}`);
        }
        
        return new PokerCard(suit, rank);
    }
    
    static compare(cardA, cardB) {
        return cardB.value - cardA.value;
    }
}

// ================ CLASSE BARALHO ================
export class PokerDeck {
    constructor() {
        this.cards = [];
        this.burnedCards = [];
        this.usedCards = [];
        this.reset();
    }
    
    // Reseta o baralho para 52 cartas novas
    reset() {
        console.log('♠️ Resetting deck...');
        this.cards = [];
        this.burnedCards = [];
        this.usedCards = [];
        
        const suits = Object.keys(SUITS);
        const ranks = Object.keys(RANKS);
        
        // Cria 52 cartas
        for (let suit of suits) {
            for (let rank of ranks) {
                this.cards.push(new PokerCard(suit, rank));
            }
        }
        
        console.log(`✅ Deck reset: ${this.cards.length} cards`);
        return this.cards;
    }
    
    // Embaralha usando Fisher-Yates algorithm
    shuffle() {
        console.log('🔀 Shuffling deck...');
        let currentIndex = this.cards.length;
        
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            
            // Troca as cartas
            [this.cards[currentIndex], this.cards[randomIndex]] = 
            [this.cards[randomIndex], this.cards[currentIndex]];
        }
        
        console.log(`✅ Deck shuffled: ${this.cards.length} cards`);
        return this.cards;
    }
    
    // Distribui cartas
    deal(count = 1, faceUp = false) {
        if (this.cards.length < count) {
            console.warn(`⚠️ Not enough cards. Requested: ${count}, Available: ${this.cards.length}`);
            this.restoreUsedCards();
        }
        
        const dealtCards = this.cards.splice(0, count);
        
        // Configura visibilidade
        dealtCards.forEach(card => {
            card.faceUp = faceUp;
        });
        
        this.usedCards.push(...dealtCards);
        
        console.log(`🃏 Dealt ${count} card(s): ${dealtCards.map(c => c.display).join(', ')}`);
        return dealtCards;
    }
    
    // Distribui cartas específicas (útil para testes)
    dealSpecific(cardIds, faceUp = false) {
        const cards = [];
        
        for (const cardId of cardIds) {
            const index = this.cards.findIndex(c => c.id === cardId);
            if (index !== -1) {
                const card = this.cards.splice(index, 1)[0];
                card.faceUp = faceUp;
                cards.push(card);
            }
        }
        
        if (cards.length > 0) {
            this.usedCards.push(...cards);
            console.log(`🃏 Dealt specific cards: ${cards.map(c => c.display).join(', ')}`);
        }
        
        return cards;
    }
    
    // Queima uma carta (burn card)
    burnCard() {
        if (this.cards.length === 0) {
            console.warn('⚠️ Trying to burn card with empty deck');
            return null;
        }
        
        const burnedCard = this.deal(1, false)[0];
        this.burnedCards.push(burnedCard);
        
        console.log(`🔥 Burned card: ${burnedCard.display}`);
        return burnedCard;
    }
    
    // Restaura cartas usadas (para nova mão)
    restoreUsedCards() {
        console.log('🔄 Restoring used cards...');
        
        // Junta todas as cartas novamente
        this.cards = [...this.cards, ...this.usedCards, ...this.burnedCards];
        this.usedCards = [];
        this.burnedCards = [];
        
        // Embaralha novamente
        this.shuffle();
        
        console.log(`✅ Cards restored. Total: ${this.cards.length} cards`);
        return this.cards;
    }
    
    // Olha as próximas cartas sem remover
    peek(count = 1) {
        return this.cards.slice(0, count);
    }
    
    // Retorna estatísticas do baralho
    getStats() {
        return {
            remaining: this.cards.length,
            used: this.usedCards.length,
            burned: this.burnedCards.length,
            total: this.cards.length + this.usedCards.length + this.burnedCards.length
        };
    }
    
    // Converte para JSON para salvar estado
    toJSON() {
        return {
            remainingCards: this.cards.map(c => c.toJSON()),
            usedCards: this.usedCards.map(c => c.toJSON()),
            burnedCards: this.burnedCards.map(c => c.toJSON())
        };
    }
    
    // Restaura de JSON
    static fromJSON(jsonData) {
        const deck = new PokerDeck();
        deck.cards = jsonData.remainingCards.map(cardData => {
            const card = new PokerCard(cardData.suit, cardData.rank);
            card.faceUp = cardData.faceUp;
            return card;
        });
        deck.usedCards = jsonData.usedCards.map(cardData => {
            const card = new PokerCard(cardData.suit, cardData.rank);
            card.faceUp = cardData.faceUp;
            return card;
        });
        deck.burnedCards = jsonData.burnedCards.map(cardData => {
            const card = new PokerCard(cardData.suit, cardData.rank);
            card.faceUp = cardData.faceUp;
            return card;
        });
        return deck;
    }
}

// ================ FUNÇÕES ÚTEIS ================

// Cria um novo baralho pronto
export function createDeck(shuffle = true) {
    const deck = new PokerDeck();
    if (shuffle) deck.shuffle();
    return deck;
}

// Ordena cartas por valor
export function sortCards(cards, descending = true) {
    return [...cards].sort((a, b) => {
        return descending ? b.value - a.value : a.value - b.value;
    });
}

// Filtra cartas por naipe
export function filterBySuit(cards, suit) {
    return cards.filter(card => card.suit === suit);
}

// Filtra cartas por valor mínimo
export function filterByMinValue(cards, minValue) {
    return cards.filter(card => card.value >= minValue);
}

// Verifica se há pares nas cartas
export function hasPair(cards) {
    const values = cards.map(c => c.value);
    return new Set(values).size !== values.length;
}

// Encontra o valor mais comum nas cartas
export function findMostCommonValue(cards) {
    const frequency = {};
    cards.forEach(card => {
        frequency[card.value] = (frequency[card.value] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommonValue = null;
    
    for (const [value, count] of Object.entries(frequency)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonValue = parseInt(value);
        }
    }
    
    return { value: mostCommonValue, count: maxCount };
}

// Formata cartas para display
export function formatCardsForDisplay(cards, showAll = false) {
    if (!cards || cards.length === 0) return 'Nenhuma carta';
    
    return cards
        .map(card => showAll || card.faceUp ? card.display : '🂠')
        .join(' ');
}

// Cria uma string única para cache de mãos
export function createHandHash(cards) {
    return sortCards(cards)
        .map(card => card.id)
        .join('-');
}

// Exemplo de uso rápido:
/*
import { createDeck, PokerCard } from './baralho-texas.js';

const deck = createDeck();
const hand = deck.deal(2, true); // Suas cartas
const flop = deck.deal(3, true); // Flop
deck.burnCard();
const turn = deck.deal(1, true); // Turn
deck.burnCard();
const river = deck.deal(1, true); // River

console.log('Sua mão:', formatCardsForDisplay(hand));
console.log('Board:', formatCardsForDisplay([...flop, ...turn, ...river]));
*/

// Exporta tudo como um módulo completo
export default {
    SUITS,
    RANKS,
    PokerCard,
    PokerDeck,
    createDeck,
    sortCards,
    filterBySuit,
    filterByMinValue,
    hasPair,
    findMostCommonValue,
    formatCardsForDisplay,
    createHandHash
};