import { Navigate, Outlet } from "react-router-dom";
import { getAdminSession } from "@/lib/auth-session";

/**
 * Requires a stored admin session (api_token from login).
 */
const ProtectedRoute = () => {
  if (!getAdminSession()?.api_token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
