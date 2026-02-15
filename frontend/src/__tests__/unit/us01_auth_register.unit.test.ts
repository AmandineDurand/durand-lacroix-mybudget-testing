// Source: user_story_01_front.md — Inscription d'un Nouvel Utilisateur
import { describe, expect, test } from "vitest";
import {
  getPasswordStrength,
  validatePassword,
  validateUsername,
} from "../../utils/validation";

describe("US01 - validations d'inscription", () => {
  test("Le champ 'Nom d'utilisateur' est requis (validation client avant l'appel API)", () => {
    // Arrange
    const username = "";

    // Act
    const error = validateUsername(username);

    // Assert
    expect(error).toBe("Minimum 3 caractères");
  });

  test("Le champ 'Mot de passe' est requis et doit faire au moins 8 caractères (validation client)", () => {
    // Arrange
    const password = "short";

    // Act
    const errors = validatePassword(password);

    // Assert
    expect(errors).toContain("Minimum 8 caractères");
  });

  test("Le champ 'Mot de passe' ne doit pas dépasser 72 caractères (limitation bcrypt)", () => {
    // Arrange
    const password = "a".repeat(73);

    // Act
    const errors = validatePassword(password);

    // Assert
    expect(errors).toContain("Maximum 72 caractères");
  });

  test("Affichage d'un indicateur de force du mot de passe (faible/moyen/fort) en temps réel pendant la saisie", () => {
    // Arrange
    const weak = "abc";
    const strong = "Str0ng!Pass123";

    // Act
    const weakScore = getPasswordStrength(weak);
    const strongScore = getPasswordStrength(strong);

    // Assert
    expect(weakScore).toBeLessThan(strongScore);
  });
});
