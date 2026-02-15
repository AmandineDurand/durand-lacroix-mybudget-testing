// Source: user_story_08_front.md — Tableau de Bord de Santé Budgétaire (Jauges & KPI)
import { describe, expect, test } from "vitest";
import { euro, progressBg } from "../../components/BudgetCard";

describe("US08 - utilitaires KPI", () => {
  test("Les montants sont formatés en locale fr-FR", () => {
    // Arrange
    const amount = 1200;

    // Act
    const formatted = euro(amount);

    // Assert
    expect(formatted).toContain("€");
    expect(formatted).toMatch(/1[\s\u202F]200,00\s?€/);
  });

  test("La progression applique une couleur dynamique selon le pourcentage", () => {
    // Arrange
    const low = 20;
    const high = 95;

    // Act
    const lowColor = progressBg(low);
    const highColor = progressBg(high);

    // Assert
    expect(lowColor).not.toBe(highColor);
  });
});
