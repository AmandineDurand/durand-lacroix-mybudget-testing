import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AddTransaction from "./pages/AddTransaction";
import TransactionList from "./pages/TransactionList";
import BudgetList from "./pages/BudgetList";
import BudgetDetail from "./pages/BudgetDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-bg-concrete w-full max-w-[1400px] mx-auto">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Home />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TransactionList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AddTransaction />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budgets"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BudgetList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budgets/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BudgetDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
