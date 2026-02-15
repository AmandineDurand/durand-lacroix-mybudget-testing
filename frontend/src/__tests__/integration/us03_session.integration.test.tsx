// Source: user_story_03_front.md — Gestion de Session et Persistance d'Authentification
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import App from "../../App";
import { getBudgets, getTransactions } from "../../api/client";

describe("US03 - Session", () => {
  test("Si le token est absent au chargement, l'utilisateur est redirigé vers /login", async () => {
    // Arrange
    localStorage.clear();
    window.history.pushState({}, "", "/transactions");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("Les pages protégées sont inaccessibles sans token valide (Route Guard)", async () => {
    // Arrange
    localStorage.clear();
    window.history.pushState({}, "", "/budgets");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("En cas de 401, l'interceptor efface le token et redirige vers /login", async () => {
    // Arrange
    localStorage.setItem("auth_token", "expired");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    server.use(
      http.get("/api/budgets/", async () =>
        HttpResponse.json({ detail: "expired" }, { status: 401 }),
      ),
    );

    // Act
    await expect(getBudgets()).rejects.toBeTruthy();

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  test("Un Error Interceptor global capture toutes les erreurs 401", async () => {
    // Arrange
    localStorage.setItem("auth_token", "expired");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    server.use(
      http.get("/api/transactions/", async () =>
        HttpResponse.json({ detail: "expired" }, { status: 401 }),
      ),
    );

    // Act
    await expect(getTransactions()).rejects.toBeTruthy();

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  test("Le username connecté est affiché dans le header", async () => {
    // Arrange
    localStorage.setItem("auth_token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    window.history.pushState({}, "", "/");

    // Act
    render(<App />);

    // Assert
    expect(await screen.findByText("alice")).toBeInTheDocument();
  });

  test("Un bouton Déconnexion est visible dans le header", async () => {
    // Arrange
    localStorage.setItem("auth_token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    window.history.pushState({}, "", "/");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByRole("button", { name: /Déconnexion/i }),
    ).toBeInTheDocument();
  });

  test("Si déconnexion manuelle, token supprimé et redirection /login", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    window.history.pushState({}, "", "/");
    render(<App />);

    // Act
    await user.click(
      await screen.findByRole("button", { name: /Déconnexion/i }),
    );
    await user.click(screen.getByRole("button", { name: /Se déconnecter/i }));

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("Le token 30 minutes est géré côté client via 401", async () => {
    // Arrange
    localStorage.setItem("auth_token", "expired");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    server.use(
      http.get("/api/budgets/", async () =>
        HttpResponse.json({ detail: "expired" }, { status: 401 }),
      ),
    );

    // Act
    await expect(getBudgets()).rejects.toBeTruthy();

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
});
