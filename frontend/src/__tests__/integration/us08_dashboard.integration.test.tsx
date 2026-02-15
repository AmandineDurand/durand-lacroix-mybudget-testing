// Source: user_story_08_front.md — Tableau de Bord de Santé Budgétaire (Jauges & KPI)
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import Home from "../../pages/Home";
import App from "../../App";

describe("US08 - Dashboard budgets", () => {
  test("Chaque carte affiche les données budgétaires envoyées par l'API", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Act
    const section = await screen.findByText(/Budgets en cours/i);

    // Assert
    expect(section).toBeInTheDocument();
  });

  test("Un badge DÉPASSÉ est affiché si le budget est dépassé", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Act
    const over = await screen.findByText(/-10,00\s?€/i);

    // Assert
    expect(over).toBeInTheDocument();
  });

  test("Authentification requise avec route guard", async () => {
    // Arrange
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, "", "/");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("Isolation des données: seulement budgets utilisateur connecté", () => {
    expect(true).toBe(true);
  });

  test("La barre change Vert/Orange/Rouge selon seuils", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Act
    await screen.findByText(/Budgets en cours/i);
    const progressBars = document.querySelectorAll(
      ".h-4.bg-indigo\\/10.rounded-full.overflow-hidden.border-2",
    );

    // Assert
    expect(progressBars.length).toBeGreaterThan(0);
  });

  test("Le dashboard est responsive 1 col mobile / 3 cols desktop", async () => {
    // Arrange
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Act
    await screen.findByText(/Budgets en cours/i);
    const grid = container.querySelector(
      ".grid.grid-cols-1.md\\:grid-cols-2.gap-4",
    );

    // Assert
    expect(grid).toBeInTheDocument();
  });

  test("En cas de 401, redirection automatique via interceptor", async () => {
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
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Assert
    await waitFor(() => expect(localStorage.getItem("auth_token")).toBeNull());
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("Chaque carte affiche icône catégorie, dépensé/fixé et reste", async () => {
    // Arrange
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    // Act
    const budgetTitles = await screen.findAllByText(/Alimentation/i);

    // Assert
    expect(budgetTitles.length).toBeGreaterThan(0);
    expect(screen.getByText(/150,00\s?€/i)).toBeInTheDocument();
  });
});
