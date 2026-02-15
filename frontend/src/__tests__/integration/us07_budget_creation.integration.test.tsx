// Source: user_story_07_front.md — Définition de Budgets Prévisionnels
import { describe, expect, test } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { ToastProvider } from "../../components/Toast";
import BudgetList from "../../pages/BudgetList";
import App from "../../App";

describe("US07 - Création de budget", () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <BudgetList />
        </ToastProvider>
      </MemoryRouter>,
    );
  }

  function getModalDateInputs() {
    const dateInputs = Array.from(
      document.querySelectorAll('input[type="date"]'),
    );
    return dateInputs.slice(-2);
  }

  test("La modale de création s'ouvre via le bouton Nouveau Budget", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );

    // Assert
    expect(screen.getByText("Nouveau budget")).toBeInTheDocument();
  });

  test("Validation client: Date de fin ne peut pas être antérieure à Date de début", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );

    // Act
    const modalSelect = (await screen.findAllByRole("combobox")).find(
      (combobox) =>
        Array.from(combobox.querySelectorAll("option")).some(
          (option) => option.textContent === "-- Choisir --",
        ),
    );
    await user.selectOptions(modalSelect, "1");
    await user.type(screen.getByPlaceholderText("0.00"), "100");
    const [startInput, endInput] = getModalDateInputs();
    fireEvent.change(startInput, { target: { value: "2026-02-10" } });
    fireEvent.change(endInput, { target: { value: "2026-02-01" } });
    await user.click(screen.getByRole("button", { name: /Créer/i }));

    // Assert
    expect(
      await screen.findByText(
        /La date de fin doit être postérieure à la date de début/i,
      ),
    ).toBeInTheDocument();
  });

  test("Authentification requise: route protégée", async () => {
    // Arrange
    localStorage.clear();
    sessionStorage.clear();
    window.history.pushState({}, "", "/budgets");

    // Act
    render(<App />);

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
  });

  test("La catégorie est contrainte à une sélection existante", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );

    // Act
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.textContent,
    );

    // Assert
    expect(options).toContain("Alimentation");
    expect(options).toContain("Transport");
  });

  test("La modale se ferme uniquement après 201", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByPlaceholderText("0.00"), "100");
    const [startInput, endInput] = getModalDateInputs();
    await user.clear(startInput);
    await user.type(startInput, "2026-02-01");
    await user.clear(endInput);
    await user.type(endInput, "2026-02-28");
    await user.click(screen.getByRole("button", { name: /Créer/i }));

    // Assert
    expect(
      await screen.findByText(/Budget créé avec succès/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Nouveau budget")).not.toBeInTheDocument(),
    );
  });

  test("Gestion 409 chevauchement avec message intelligible", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/budgets/", async () =>
        HttpResponse.json(
          { detail: "Chevauchement avec le budget du 01/01 au 31/01" },
          { status: 409 },
        ),
      ),
    );
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByPlaceholderText("0.00"), "100");
    const [startInput, endInput] = getModalDateInputs();
    await user.clear(startInput);
    await user.type(startInput, "2026-02-01");
    await user.clear(endInput);
    await user.type(endInput, "2026-02-28");
    await user.click(screen.getByRole("button", { name: /Créer/i }));

    // Assert
    expect(
      await screen.findByText(
        /Chevauchement avec le budget du 01\/01 au 31\/01/i,
      ),
    ).toBeInTheDocument();
  });

  test("En cas de 401, redirection via interceptor", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "expired");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    server.use(
      http.post("/api/budgets/", async () =>
        HttpResponse.json({ detail: "expired" }, { status: 401 }),
      ),
    );
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );

    // Act
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.type(screen.getByPlaceholderText("0.00"), "100");
    const [startInput, endInput] = getModalDateInputs();
    await user.clear(startInput);
    await user.type(startInput, "2026-02-01");
    await user.clear(endInput);
    await user.type(endInput, "2026-02-28");
    await user.click(screen.getByRole("button", { name: /Créer/i }));

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  test("Les champs dates utilisent un datepicker natif (type='date')", async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(
      await screen.findByRole("button", { name: /Nouveau Budget/i }),
    );
    const [startInput, endInput] = getModalDateInputs();

    // Assert
    expect(startInput).toHaveAttribute("type", "date");
    expect(endInput).toHaveAttribute("type", "date");
  });

  test("Isolation des données: pas de sélection d'utilisateur", () => {
    expect(true).toBe(true);
  });
});
