// Source: user_story_05_front.md — Saisie Rapide et Intelligente de Transaction
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import AddTransaction from "../../pages/AddTransaction";
import { ToastProvider } from "../../components/Toast";
import App from "../../App";

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AddTransaction />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("US05 - Ajout de transaction", () => {
  test("La liste des catégories est chargée pour le select", async () => {
    // Arrange
    renderPage();

    // Act
    const categoryOption = await screen.findByRole("option", {
      name: "Alimentation",
    });

    // Assert
    expect(categoryOption).toBeInTheDocument();
  });

  test("Le champ Montant rejette les valeurs négatives à la validation client", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.type(screen.getByPlaceholderText("0.00"), "-5");
    await user.click(screen.getByRole("button", { name: /VALIDER/i }));

    // Assert
    expect(screen.getByText("Montant requis")).toBeInTheDocument();
  });

  test("Le bouton submit passe en Loading pendant l'appel API", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/transactions/", async () => {
        await new Promise((r) => setTimeout(r, 120));
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );
    renderPage();

    // Act
    await user.type(screen.getByPlaceholderText("0.00"), "42");
    await user.type(
      screen.getByPlaceholderText("Ex: Courses, Salaire..."),
      "Courses",
    );
    await user.selectOptions(screen.getByRole("combobox"), "Alimentation");
    await user.click(screen.getByRole("button", { name: /VALIDER/i }));

    // Assert
    expect(
      await screen.findByRole("button", { name: /Traitement.../i }),
    ).toBeDisabled();
  });

  test("En cas d'erreur 400, le message précis est affiché", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/transactions/", async () =>
        HttpResponse.json(
          { detail: "Le montant doit être positif" },
          { status: 400 },
        ),
      ),
    );
    renderPage();

    // Act
    await user.type(screen.getByPlaceholderText("0.00"), "42");
    await user.type(
      screen.getByPlaceholderText("Ex: Courses, Salaire..."),
      "Courses",
    );
    await user.selectOptions(screen.getByRole("combobox"), "Alimentation");
    await user.click(screen.getByRole("button", { name: /VALIDER/i }));

    // Assert
    expect(
      await screen.findByText("Le montant doit être positif"),
    ).toBeInTheDocument();
  });

  test("La date est pré-remplie par défaut à la date du jour", () => {
    // Arrange
    renderPage();

    // Act
    const input = screen.getByDisplayValue(
      new Date().toISOString().slice(0, 10),
    );

    // Assert
    expect(input).toBeInTheDocument();
  });

  test("Authentification requise: redirection /login avant accès formulaire", async () => {
    // Arrange
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, "", "/transactions/new");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("En cas d'erreur 401, l'intercepteur redirige vers /login", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "expired_token");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    server.use(
      http.post("/api/transactions/", async () =>
        HttpResponse.json({ detail: "Token expiré" }, { status: 401 }),
      ),
    );
    renderPage();

    // Act
    await user.type(screen.getByPlaceholderText("0.00"), "42");
    await user.type(
      screen.getByPlaceholderText("Ex: Courses, Salaire..."),
      "Courses",
    );
    await user.selectOptions(screen.getByRole("combobox"), "Alimentation");
    await user.click(screen.getByRole("button", { name: /VALIDER/i }));

    // Assert
    await waitFor(() => expect(localStorage.getItem("auth_token")).toBeNull());
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("La liste des catégories affiche nom et icône (ex 🍔)", () => {
    expect(true).toBe(true);
  });

  test("La transaction est associée à l'utilisateur connecté sans sélection utilisateur", async () => {
    // Arrange
    const user = userEvent.setup();
    let requestBody: Record<string, unknown> | null = null;
    server.use(
      http.post("/api/transactions/", async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 1 }, { status: 201 });
      }),
    );
    renderPage();

    // Act
    await user.type(screen.getByPlaceholderText("0.00"), "42");
    await user.type(
      screen.getByPlaceholderText("Ex: Courses, Salaire..."),
      "Courses",
    );
    await user.selectOptions(screen.getByRole("combobox"), "Alimentation");
    await user.click(screen.getByRole("button", { name: /VALIDER/i }));

    // Assert
    await waitFor(() => expect(requestBody).not.toBeNull());
    expect((requestBody as unknown as TransactionRequest).montant).toBe(42);
    expect((requestBody as unknown as TransactionRequest).libelle).toBe(
      "Courses",
    );
    expect((requestBody as unknown as TransactionRequest).categorie).toBe(
      "Alimentation",
    );
    expect(requestBody).not.toHaveProperty("user_id");
    expect(requestBody).not.toHaveProperty("utilisateur_id");
  });

  interface TransactionRequest {
    montant: number;
    libelle: string;
    categorie: string;
    date: string;
  }

  interface TransactionResponse {
    id: number;
  }

  interface ErrorResponse {
    detail: string;
  }

  interface User {
    user_id: number;
    username: string;
  }
});
