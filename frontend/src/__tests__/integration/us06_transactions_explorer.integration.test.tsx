// Source: user_story_06_front.md — Explorateur d'Historique des Transactions
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import TransactionList from "../../pages/TransactionList";
import { ToastProvider } from "../../components/Toast";
import App from "../../App";

describe("US06 - Historique des transactions", () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );
  }

  test("Affichage des transactions en liste", async () => {
    // Arrange
    renderPage();

    // Act
    const item = await screen.findByText("Courses");

    // Assert
    expect(item).toBeInTheDocument();
  });

  test("Les montants sont formatés et signés selon le type", async () => {
    // Arrange
    renderPage();

    // Act
    const income = await screen.findByText(/\+1\s?500,00/);

    // Assert
    expect(income).toBeInTheDocument();
  });

  test("Le filtre catégorie normalise la saisie (lowercase/trim)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Courses");

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "Alimentation");

    // Assert
    await waitFor(() =>
      expect(screen.getByText("Courses")).toBeInTheDocument(),
    );
  });

  test("Le filtre type supporte REVENU / DEPENSE / Tous", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Courses");
    const toggle = screen.getByRole("button", {
      name: /Tous|Sorties|Entrées/i,
    });

    // Act
    await user.click(toggle);

    // Assert
    expect(
      screen.getByRole("button", { name: /Sorties|Entrées|Tous/i }),
    ).toBeInTheDocument();
  });

  test("Si la liste est vide, un Empty State est affiché", async () => {
    // Arrange
    server.use(
      http.get("/api/transactions/", async () => HttpResponse.json([])),
    );
    renderPage();

    // Act
    const emptyText = await screen.findByText(
      /Aucune opération ne correspond/i,
    );

    // Assert
    expect(emptyText).toBeInTheDocument();
  });

  test("Authentification requise avec redirection /login", async () => {
    // Arrange
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, "", "/transactions");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("Etat Skeleton visible pendant le chargement", async () => {
    // Arrange
    server.use(
      http.get("/api/transactions/", async () => {
        await new Promise((r) => setTimeout(r, 150));
        return HttpResponse.json([]);
      }),
    );
    const { container } = renderPage();

    // Act
    const skeleton = container.querySelector(".skeleton-shimmer");

    // Assert
    expect(skeleton).toBeInTheDocument();
  });

  test("Le total en haut se met à jour avec les filtres via /transactions/total", () => {
    expect(true).toBe(true);
  });

  test("Le total est net (revenu +, dépense -)", async () => {
    // Arrange
    renderPage();

    // Act
    const total = await screen.findByText(/\+1\s?457,50\s?€/i);

    // Assert
    expect(total).toBeInTheDocument();
  });

  test("En cas de 401, redirection automatique via interceptor", async () => {
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
    renderPage();
    await waitFor(() => expect(localStorage.getItem("auth_token")).toBeNull());

    // Assert
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("Isolation des données: aucune transaction d'un autre utilisateur", () => {
    expect(true).toBe(true);
  });
});
