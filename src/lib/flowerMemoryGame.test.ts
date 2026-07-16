import { describe, expect, it } from "vitest";
import { createFlowerGame, selectFlowerCard, useFlowerHint } from "./flowerMemoryGame";

describe("Flower Memory Match state", () => {
  it("creates four pairs and records flips", () => {
    const game = createFlowerGame(() => 0.5);
    expect(game.cards).toHaveLength(8);
    expect(new Set(game.cards.map(card => card.pair)).size).toBe(4);
    expect(selectFlowerCard(game, game.cards[0].id).flips).toBe(1);
  });
  it("matches a pair and records hints", () => {
    const game = createFlowerGame(() => 0.5);
    const pair = game.cards.filter(card => card.pair === game.cards[0].pair);
    const matched = selectFlowerCard(selectFlowerCard(game, pair[0].id), pair[1].id);
    expect(matched.cards.filter(card => card.matched)).toHaveLength(2);
    expect(useFlowerHint(matched).state.hints).toBe(1);
  });
});
