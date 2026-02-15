// Source: user_story_02_front.md — Connexion et Authentification Utilisateur
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import Login from "../../pages/Login";
import { ToastProvider } from "../../components/Toast";
import { AuthProvider } from "../../contexts/AuthContext";

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <Login />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("US02 - Connexion", () => {
  test("Le champ 'Nom d'utilisateur' est requis (validation client)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(screen.getByText("Nom d'utilisateur requis")).toBeInTheDocument();
  });

  test("Le champ 'Mot de passe' est requis (validation client)", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(screen.getByText("Mot de passe requis")).toBeInTheDocument();
  });

  test("La case 'Se souvenir de moi' est disponible", async () => {
    // Arrange
    renderLogin();

    // Act
    const checkbox = screen.getByRole("checkbox", {
      name: /Se souvenir de moi/i,
    });

    // Assert
    expect(checkbox).toBeInTheDocument();
  });

  test("Le bouton 'Se connecter' passe en état Loading pendant l'appel API", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/login", async () => {
        await new Promise((r) => setTimeout(r, 120));
        return HttpResponse.json({
          access_token: "jwt",
          user_id: 1,
          username: "alice",
        });
      }),
    );
    renderLogin();

    // Act
    await user.type(
      screen.getByPlaceholderText("Votre nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Votre mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(
      await screen.findByRole("button", { name: /Connexion.../i }),
    ).toBeDisabled();
  });

  test("Gestion des erreurs 401 : afficher un message d'identifiants incorrects", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/login", async () =>
        HttpResponse.json({ detail: "invalid" }, { status: 401 }),
      ),
    );
    renderLogin();

    // Act
    await user.type(
      screen.getByPlaceholderText("Votre nom d'utilisateur"),
      "alice",
    );
    await user.type(screen.getByPlaceholderText("Votre mot de passe"), "wrong");
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(
      await screen.findByText("Nom d'utilisateur ou mot de passe incorrect"),
    ).toBeInTheDocument();
  });

  test("Gestion des erreurs 500 : afficher le message serveur", async () => {
    // Arrange
    const user = userEvent.setup();
    server.use(
      http.post("/api/auth/login", async () =>
        HttpResponse.json({ detail: "boom" }, { status: 500 }),
      ),
    );
    renderLogin();

    // Act
    await user.type(
      screen.getByPlaceholderText("Votre nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Votre mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(
      await screen.findByText(
        "Erreur de connexion au serveur. Veuillez réessayer.",
      ),
    ).toBeInTheDocument();
  });

  test("Un lien 'Créer un compte' redirige vers la page d'inscription", () => {
    // Arrange
    renderLogin();

    // Act
    const link = screen.getByRole("link", { name: /Créer un compte/i });

    // Assert
    expect(link).toHaveAttribute("href", "/register");
  });

  test("Le token est stocké avec la clé `auth_token`", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.type(
      screen.getByPlaceholderText("Votre nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Votre mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(sessionStorage.getItem("auth_token")).toBe("jwt-token-123");
  });

  test("Les informations utilisateur sont stockées pour affichage UI", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.type(
      screen.getByPlaceholderText("Votre nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Votre mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    const stored = sessionStorage.getItem("user");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored || "{}")).toMatchObject({ username: "alice" });
  });

  test("Après connexion réussie, redirection dashboard", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.type(
      screen.getByPlaceholderText("Votre nom d'utilisateur"),
      "alice",
    );
    await user.type(
      screen.getByPlaceholderText("Votre mot de passe"),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    // Assert
    expect(await screen.findByText(/Connexion réussie/i)).toBeInTheDocument();
  });
});
