// Source: user_story_04_front.md — Déconnexion Manuelle et Sécurité de Session
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

describe("US04 - Déconnexion", () => {
  test("Le bouton Déconnexion est visible dans le header des pages protégées", async () => {
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

  test("Au clic sur Déconnexion, une modale de confirmation s'affiche", async () => {
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

    // Assert
    expect(
      screen.getByText(/Voulez-vous vraiment vous déconnecter/i),
    ).toBeInTheDocument();
  });

  test("La modale propose Annuler et Se déconnecter", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    window.history.pushState({}, "", "/");
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: /Déconnexion/i }),
    );

    // Act
    const cancelBtn = screen.getByRole("button", { name: /Annuler/i });
    const confirmBtn = screen.getByRole("button", { name: /Se déconnecter/i });

    // Assert
    expect(cancelBtn).toBeInTheDocument();
    expect(confirmBtn).toBeInTheDocument();
  });

  test("Lors de la confirmation, le token et les infos utilisateur sont supprimés", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    window.history.pushState({}, "", "/");
    const { unmount } = render(<App />);

    // Act
    await user.click(
      await screen.findByRole("button", { name: /Déconnexion/i }),
    );
    await user.click(screen.getByRole("button", { name: /Se déconnecter/i }));

    // Assert
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  test("Notification toast verte 'Déconnexion réussie' après redirection", async () => {
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
    expect(await screen.findByText("Déconnexion réussie")).toBeInTheDocument();
  });

  test("Après déconnexion, tentative d'accès à une page protégée redirige vers /login", async () => {
    // Arrange
    const user = userEvent.setup();
    localStorage.setItem("auth_token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ user_id: 1, username: "alice" }),
    );
    window.history.pushState({}, "", "/");
    const { unmount } = render(<App />);

    // Act - Déconnexion
    await user.click(
      await screen.findByRole("button", { name: /Déconnexion/i }),
    );
    await user.click(screen.getByRole("button", { name: /Se déconnecter/i }));

    // Simuler le bouton "Précédent" du navigateur vers une page protégée
    window.history.pushState({}, "", "/transactions");
    unmount();
    render(<App />);

    // Assert - Redirigé vers login
    expect(
      await screen.findByRole("button", { name: /Se connecter/i }),
    ).toBeInTheDocument();
  });
});
