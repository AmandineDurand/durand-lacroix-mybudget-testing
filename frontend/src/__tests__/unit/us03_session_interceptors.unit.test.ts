// Source: user_story_03_front.md — Gestion de Session et Persistance d'Authentification
import { describe, expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup";
import { getBudgets, getCategories } from "../../api/client";

describe("US03 - Interceptors HTTP", () => {
  test("Un HTTP Interceptor injecte Authorization: Bearer <token> sur /api/* hors auth", async () => {
    // Arrange
    localStorage.setItem("auth_token", "jwt-test");
    let header = "";
    server.use(
      http.get("/api/budgets/", ({ request }) => {
        header = request.headers.get("authorization") || "";
        return HttpResponse.json([]);
      }),
    );

    // Act
    await getBudgets();

    // Assert
    expect(header).toBe("Bearer jwt-test");
  });

  test("GET /api/categories peut être appelé sans token", async () => {
    // Arrange
    localStorage.clear();
    sessionStorage.clear();

    // Act
    const categories = await getCategories();

    // Assert
    expect(Array.isArray(categories)).toBe(true);
  });
});
