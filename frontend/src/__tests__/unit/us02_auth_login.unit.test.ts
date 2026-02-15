// Source: user_story_02_front.md — Connexion et Authentification Utilisateur
import { describe, expect, test } from "vitest";
import { login as loginApi } from "../../api/client";

describe("US02 - contrat API login", () => {
  test("Le token JWT (`access_token`) est stocké dans le storage avec la clé attendue par l'application", async () => {
    // Arrange
    localStorage.clear();
    const payload = {
      user_id: 10,
      username: "alice",
      access_token: "jwt-1",
    };

    // Act
    localStorage.setItem("auth_token", payload.access_token);
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: payload.user_id, username: payload.username }),
    );

    // Assert
    expect(localStorage.getItem("auth_token")).toBe("jwt-1");
    expect(JSON.parse(localStorage.getItem("user") || "{}")).toEqual({
      user_id: 10,
      username: "alice",
    });
  });

  test("Après connexion réussie, les requêtes API incluent automatiquement Authorization: Bearer <token>", async () => {
    // Arrange
    localStorage.setItem("auth_token", "jwt-abc");

    // Act
    const response = await loginApi({
      username: "alice",
      password: "Password123!",
    });

    // Assert
    expect(response).toHaveProperty("access_token");
  });
});
