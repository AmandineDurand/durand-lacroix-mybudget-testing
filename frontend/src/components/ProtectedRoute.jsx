import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-5">
        <div className="w-24 h-24 border-8 border-indigo border-t-acid-green rounded-full animate-spin mb-8"></div>
        <h2 className="font-display font-black text-2xl uppercase text-indigo animate-pulse">
          Authentification...
        </h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
