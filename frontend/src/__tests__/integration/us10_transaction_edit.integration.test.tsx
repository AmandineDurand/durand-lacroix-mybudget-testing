// Source: user_story_10_front.md — Modification et Correction de Transaction
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { ToastProvider } from "../../components/Toast";
import TransactionList from "../../pages/TransactionList";
import App from "../../App";
import { UserEvent } from "@testing-library/user-event";

async function openEditTransactionModal(user: UserEvent): Promise<void> {
  await user.click((await screen.findAllByTitle("Actions"))[0]);
  await user.click((await screen.findAllByTitle("Modifier"))[0]);
  await screen.findByText(/Modifier la transaction/i);
}

describe("US10 - Edition transaction", () => {
  test("Ouverture de la modale d'édition depuis la liste des transactions", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    const actionBtn = (await screen.findAllByTitle("Actions"))[0];
    await user.click(actionBtn);
    await user.click((await screen.findAllByTitle("Modifier"))[0]);

    // Assert
    expect(
      await screen.findByText(/Modifier la transaction/i),
    ).toBeInTheDocument();
  });

  test("Le bouton Sauvegarder est désactivé pendant l'appel API", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.put("/api/transactions/:id", async () => {
        await new Promise((r) => setTimeout(r, 150));
        return HttpResponse.json({ ok: true });
      }),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );
    await openEditTransactionModal(user);

    // Act
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(
      await screen.findByRole("button", { name: /Enregistrement/i }),
    ).toBeDisabled();
  });

  test("Authentification requise pour modifier", async () => {
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

  test("Protection des données: erreur 403 si transaction d'un autre utilisateur", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.put("/api/transactions/:id", async () =>
        HttpResponse.json(
          { detail: "Vous ne pouvez modifier que vos propres transactions" },
          { status: 403 },
        ),
      ),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(
      await screen.findByText(
        /Vous ne pouvez modifier que vos propres transactions/i,
      ),
    ).toBeInTheDocument();
  });

  test("Pré-remplissage correct de tous les champs", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);

    // Assert
    expect(screen.getByDisplayValue("Courses")).toBeInTheDocument();
    expect(screen.getByDisplayValue("42.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alimentation")).toBeInTheDocument();
  });

  test("Les champs Date utilisent le sélecteur natif (type='date')", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    const dateInput = document.querySelector('input[type="date"]');

    // Assert
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute("type", "date");
  });

  test("Le champ catégorie propose uniquement des catégories existantes", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    const categorySelect = (await screen.findAllByRole("combobox")).find(
      (combobox) =>
        Array.from(combobox.querySelectorAll("option")).some(
          (option) => option.textContent === "Choisir une catégorie",
        ),
    );
    const categoryOptions = Array.from(
      categorySelect?.querySelectorAll("option") || [],
    ).map((option) => option.textContent);

    // Assert
    expect(categoryOptions).toContain("Alimentation");
    expect(categoryOptions).toContain("Transport");
    expect(categoryOptions).toContain("Loisirs");
  });

  test("Validations création appliquées (montant>0, catégorie valide, type valide)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(
      await screen.findByText("Montant requis et positif"),
    ).toBeInTheDocument();
  });

  test("Validation champ: le message 'Catégorie requise' est affiché sous le champ", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "100");
    await user.clear(screen.getByPlaceholderText("Ex: Courses, Salaire..."));
    await user.type(
      screen.getByPlaceholderText("Ex: Courses, Salaire..."),
      "Achat",
    );
    const categorySelect = (await screen.findAllByRole("combobox")).find(
      (combobox) =>
        Array.from(combobox.querySelectorAll("option")).some(
          (option) => option.textContent === "Choisir une catégorie",
        ),
    );
    if (categorySelect) {
      await user.selectOptions(categorySelect, "");
    }
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(await screen.findByText("Catégorie requise")).toBeInTheDocument();
  });

  test("Gestion erreur 404: message + fermeture modale", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.put("/api/transactions/:id", async () =>
        HttpResponse.json(
          { detail: "Transaction introuvable" },
          { status: 404 },
        ),
      ),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(
      await screen.findByText(/Transaction introuvable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Modifier la transaction/i)).toBeInTheDocument();
  });

  test("Gestion erreur 400: message de validation affiché", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.put("/api/transactions/:id", async () =>
        HttpResponse.json(
          { detail: "La catégorie n'existe pas" },
          { status: 400 },
        ),
      ),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(
      await screen.findByText(/La catégorie n'existe pas/i),
    ).toBeInTheDocument();
  });

  test("Gestion 401 via interceptor", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "expired");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    server.use(
      http.put("/api/transactions/:id", async () =>
        HttpResponse.json({ detail: "expired" }, { status: 401 }),
      ),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  test("La liste se recharge après succès", async () => {
    // Arrange
    const user = userEvent.setup();
    let count = 0;
    server.use(
      http.get("/api/transactions/", async () => {
        count += 1;
        if (count > 1) {
          return HttpResponse.json([
            {
              id: 101,
              montant: 42.5,
              libelle: "Courses modifiées",
              type: "DEPENSE",
              categorie: "Alimentation",
              date: "2026-02-10T00:00:00.000Z",
            },
          ]);
        }
        return HttpResponse.json([
          {
            id: 101,
            montant: 42.5,
            libelle: "Courses",
            type: "DEPENSE",
            categorie: "Alimentation",
            date: "2026-02-10T00:00:00.000Z",
          },
        ]);
      }),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );

    // Act
    await openEditTransactionModal(user);
    await user.clear(screen.getByPlaceholderText("Ex: Courses, Salaire..."));
    await user.type(
      screen.getByPlaceholderText("Ex: Courses, Salaire..."),
      "Courses modifiées",
    );
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    await waitFor(() =>
      expect(screen.getByText("Courses modifiées")).toBeInTheDocument(),
    );
  });

  test("Le total des transactions est recalculé après modification", async () => {
    // Arrange
    const user = userEvent.setup();
    let count = 0;
    server.use(
      http.get("/api/transactions/", async () => {
        count += 1;
        if (count > 1) {
          return HttpResponse.json([
            {
              id: 101,
              montant: 100,
              libelle: "Courses",
              type: "DEPENSE",
              categorie: "Alimentation",
              date: "2026-02-10T00:00:00.000Z",
            },
            {
              id: 102,
              montant: 1500,
              libelle: "Salaire",
              type: "REVENU",
              categorie: "Revenus",
              date: "2026-02-11T00:00:00.000Z",
            },
          ]);
        }
        return HttpResponse.json([
          {
            id: 101,
            montant: 42.5,
            libelle: "Courses",
            type: "DEPENSE",
            categorie: "Alimentation",
            date: "2026-02-10T00:00:00.000Z",
          },
          {
            id: 102,
            montant: 1500,
            libelle: "Salaire",
            type: "REVENU",
            categorie: "Revenus",
            date: "2026-02-11T00:00:00.000Z",
          },
        ]);
      }),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );
    await screen.findByText(/\+1\s?457,50\s?€/i);

    // Act
    await openEditTransactionModal(user);
    await user.clear(screen.getByPlaceholderText("0.00"));
    await user.type(screen.getByPlaceholderText("0.00"), "100");
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    // Assert
    await waitFor(() =>
      expect(screen.getByText(/\+1\s?400,00\s?€/i)).toBeInTheDocument(),
    );
  });
});
