import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role))
    return <Navigate to="/unauthorized" />;

  return children;
}