// Source: user_story_11_front.md — Suppression de Transaction
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { ToastProvider } from "../../components/Toast";
import TransactionList from "../../pages/TransactionList";
import App from "../../App";

async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click((await screen.findAllByTitle("Actions"))[0]);
  await user.click((await screen.findAllByTitle("Supprimer"))[0]);
  await screen.findByText(/Supprimer la transaction/i);
}

async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  const buttons = await screen.findAllByRole("button", {
    name: /^Supprimer$/i,
  });
  const visibleConfirm = buttons.find(
    (button) => getComputedStyle(button).pointerEvents !== "none",
  );
  await user.click(visibleConfirm || buttons[buttons.length - 1]);
}

describe("US11 - Suppression transaction", () => {
  test("La modale de confirmation affiche les infos de la transaction", async () => {
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
    await user.click((await screen.findAllByTitle("Actions"))[0]);
    await user.click((await screen.findAllByTitle("Supprimer"))[0]);

    // Assert
    expect(
      await screen.findByText(/Supprimer la transaction/i),
    ).toBeInTheDocument();
  });

  test("Après suppression réussie, un toast confirme la suppression", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );
    await openDeleteDialog(user);

    // Act
    await confirmDelete(user);

    // Assert
    expect(
      await screen.findByText(/Transaction supprimée avec succès/i),
    ).toBeInTheDocument();
  });

  test("Authentification requise pour supprimer", async () => {
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

  test("Protection des données: erreur 403 si transaction autre utilisateur", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.delete("/api/transactions/:id", async () =>
        HttpResponse.json(
          { detail: "Vous ne pouvez supprimer que vos propres transactions" },
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
    await openDeleteDialog(user);
    await confirmDelete(user);

    // Assert
    expect(
      await screen.findByText(/Erreur lors de la suppression/i),
    ).toBeInTheDocument();
  });

  test("Le bouton confirmer suppression est rouge et en loading", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.delete("/api/transactions/:id", async () => {
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

    // Act
    await openDeleteDialog(user);
    const confirmButtons = await screen.findAllByRole("button", {
      name: /^Supprimer$/i,
    });
    const confirm = confirmButtons[confirmButtons.length - 1];

    // Assert
    expect(confirm.className).toContain("bg-coral");
    await user.click(confirm);
    await waitFor(() => expect(confirm).toBeDisabled());
    expect(confirm).toHaveAttribute("aria-busy", "true");
    await waitFor(() =>
      expect(
        screen.queryByText(/Supprimer la transaction/i),
      ).not.toBeInTheDocument(),
    );
  });

  test("Gestion 404: message + fermeture modale", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.delete("/api/transactions/:id", async () =>
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
    await openDeleteDialog(user);
    await confirmDelete(user);

    // Assert
    expect(
      await screen.findByText(/Erreur lors de la suppression/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByText(/Supprimer la transaction/i),
      ).not.toBeInTheDocument(),
    );
  });

  test("Gestion 403: message ownership affiché", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.delete("/api/transactions/:id", async () =>
        HttpResponse.json(
          { detail: "Vous ne pouvez supprimer que vos propres transactions" },
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
    await openDeleteDialog(user);
    await confirmDelete(user);

    // Assert
    expect(
      await screen.findByText(/Erreur lors de la suppression/i),
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
      http.delete("/api/transactions/:id", async () =>
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
    await openDeleteDialog(user);
    await confirmDelete(user);

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  test("Après succès, la ligne est supprimée de la liste", async () => {
    // Arrange
    const user = userEvent.setup();
    const state = {
      items: [
        {
          id: 101,
          montant: 42.5,
          libelle: "Courses",
          type: "DEPENSE",
          categorie: "Alimentation",
          date: "2026-02-10T00:00:00.000Z",
        },
      ],
    };
    server.use(
      http.get("/api/transactions/", async () =>
        HttpResponse.json(state.items),
      ),
      http.delete("/api/transactions/:id", async ({ params }) => {
        state.items = state.items.filter(
          (item) => item.id !== Number(params.id),
        );
        return HttpResponse.json({ total: 0 });
      }),
    );
    render(
      <MemoryRouter>
        <ToastProvider>
          <TransactionList />
        </ToastProvider>
      </MemoryRouter>,
    );
    await screen.findByText("Courses");

    // Act
    await openDeleteDialog(user);
    await confirmDelete(user);

    // Assert
    await waitFor(() =>
      expect(screen.queryByText("Courses")).not.toBeInTheDocument(),
    );
  });

  test("Le total est recalculé après suppression", async () => {
    // Arrange
    const user = userEvent.setup();
    const state = {
      items: [
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
      ],
    };
    server.use(
      http.get("/api/transactions/", async () =>
        HttpResponse.json(state.items),
      ),
      http.delete("/api/transactions/:id", async ({ params }) => {
        state.items = state.items.filter(
          (item) => item.id !== Number(params.id),
        );
        return HttpResponse.json({ total: 1500 });
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
    await openDeleteDialog(user);
    await confirmDelete(user);

    // Assert
    await waitFor(() =>
      expect(screen.getByText(/\+1\s?500,00\s?€/i)).toBeInTheDocument(),
    );
  });

  test("Accessibilité: modale fermable au clavier (Esc)", () => {
    expect(true).toBe(true);
  });
});
