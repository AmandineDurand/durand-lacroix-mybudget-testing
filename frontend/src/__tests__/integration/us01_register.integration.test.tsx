// Source: user_story_01_front.md — Inscription d'un Nouvel Utilisateur
import { describe, expect, test } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { ToastProvider } from "../../components/Toast";
import Register from "../../pages/Register";
import App from "../../App";

function renderRegister() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Register />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe("US01 - Inscription", () => {
  test("Validation client: le nom d'utilisateur est requis (minimum 3 caractères)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Password123!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(await screen.findByText("Minimum 3 caractères")).toBeInTheDocument();
  });

  test("Validation client: le mot de passe doit faire au moins 8 caractères", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Ab1!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Ab1!",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(await screen.findByText("Minimum 8 caractères")).toBeInTheDocument();
  });

  test("Validation client: le mot de passe ne doit pas dépasser 72 caractères", async () => {
    // Arrange
    const user = userEvent.setup();
    const tooLongPassword = "A".repeat(73);
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      tooLongPassword,
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      tooLongPassword,
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(
      await screen.findByText("Maximum 72 caractères"),
    ).toBeInTheDocument();
  });

  test("Un indicateur de force du mot de passe est affiché en temps réel", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Abcdef1!",
    );

    // Assert
    expect(screen.getByText(/Force:/i)).toBeInTheDocument();
    expect(screen.getByText("Très fort")).toBeInTheDocument();
  });

  test("Un champ 'Confirmer le mot de passe' doit correspondre au mot de passe saisi", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Password123!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Password123?",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(
      screen.getByText("Les mots de passe ne correspondent pas"),
    ).toBeInTheDocument();
  });

  test("Le mot de passe est masqué par défaut avec une icône œil pour le révéler temporairement", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();
    const passwordInput = screen.getByPlaceholderText("Minimum 8 caractères");

    // Act
    await user.click(screen.getAllByRole("button", { name: "👁️‍🗨️" })[0]);

    // Assert
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("Le bouton de soumission passe en état Loading pendant l'appel API", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/register", async () => {
        await new Promise((r) => setTimeout(r, 120));
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Password123!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(
      await screen.findByRole("button", { name: /Création.../i }),
    ).toBeDisabled();
  });

  test("Gestion des erreurs 409 : afficher 'Ce nom d'utilisateur est déjà pris'", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/register", async () =>
        HttpResponse.json({ detail: "conflict" }, { status: 409 }),
      ),
    );
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Password123!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(
      await screen.findByText("Ce nom d'utilisateur est déjà pris"),
    ).toBeInTheDocument();
  });

  test("Gestion des erreurs 400 (Bad Request) : afficher les erreurs de validation API", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/register", async () =>
        HttpResponse.json(
          { detail: "Le mot de passe doit faire au moins 8 caractères" },
          { status: 400 },
        ),
      ),
    );
    renderRegister();

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Password123!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(
      await screen.findByText(
        "Le mot de passe doit faire au moins 8 caractères",
      ),
    ).toBeInTheDocument();
  });

  test("Après création réussie, ne pas connecter automatiquement l'utilisateur et rediriger vers le login", async () => {
    // Arrange
    const user = userEvent.setup();
    window.history.pushState({}, "", "/register");
    render(<App />);

    // Act
    await user.type(
      screen.getByPlaceholderText("Choisissez un nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Minimum 8 caractères"),
      "Password123!",
    );
    await user.type(
      screen.getByPlaceholderText("Répétez le mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    // Assert
    expect(
      await screen.findByText(/Connectez-vous à votre compte/i),
    ).toBeInTheDocument();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(sessionStorage.getItem("auth_token")).toBeNull();
  });
});
