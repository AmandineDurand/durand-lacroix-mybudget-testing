import { ReactNode } from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../components/Toast";
import { AuthProvider } from "../contexts/AuthContext";
import App from "../App";

export function renderWithProviders(ui: ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
}

export function renderAppAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}
