export interface FlowerCard {
  id: string;
  pair: string;
  symbol: string;
  label: string;
  matched: boolean;
}

export interface FlowerGameState {
  cards: FlowerCard[];
  selectedIds: string[];
  flips: number;
  hints: number;
  startedAt: string;
  completedAt?: string;
}

const FLOWERS = [
  { pair: "rose", symbol: "🌹", label: "Rose" },
  { pair: "sunflower", symbol: "🌻", label: "Sunflower" },
  { pair: "tulip", symbol: "🌷", label: "Tulip" },
  { pair: "blossom", symbol: "🌸", label: "Blossom" }
];

export function createFlowerGame(random: () => number = Math.random): FlowerGameState {
  const cards = FLOWERS.flatMap(flower => [0, 1].map(copy => ({ ...flower, id: `${flower.pair}-${copy}`, matched: false })))
    .map(value => ({ value, sort: random() })).sort((a, b) => a.sort - b.sort).map(item => item.value);
  return { cards, selectedIds: [], flips: 0, hints: 0, startedAt: new Date().toISOString() };
}

export function selectFlowerCard(state: FlowerGameState, cardId: string): FlowerGameState {
  const card = state.cards.find(item => item.id === cardId);
  if (!card || card.matched || state.selectedIds.includes(cardId) || state.selectedIds.length >= 2 || state.completedAt) return state;
  const selectedIds = [...state.selectedIds, cardId];
  if (selectedIds.length < 2) return { ...state, selectedIds, flips: state.flips + 1 };
  const [first, second] = selectedIds.map(id => state.cards.find(item => item.id === id)!);
  if (first.pair !== second.pair) return { ...state, selectedIds, flips: state.flips + 1 };
  const cards = state.cards.map(item => item.pair === first.pair ? { ...item, matched: true } : item);
  const completedAt = cards.every(item => item.matched) ? new Date().toISOString() : undefined;
  return { ...state, cards, selectedIds: [], flips: state.flips + 1, completedAt };
}

export function clearUnmatchedSelection(state: FlowerGameState): FlowerGameState {
  return state.selectedIds.length === 2 ? { ...state, selectedIds: [] } : state;
}

export function useFlowerHint(state: FlowerGameState): { state: FlowerGameState; pairIds: string[] } {
  const unmatched = state.cards.filter(card => !card.matched);
  const first = unmatched[0];
  return { state: { ...state, hints: state.hints + 1 }, pairIds: first ? unmatched.filter(card => card.pair === first.pair).map(card => card.id) : [] };
}
