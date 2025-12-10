import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { UserRole } from "@/types";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  selectUser,
  selectActiveRole,
} from "@/context/authSlice";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectActiveRole);

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has at least one allowed role
  // const hasAccess = user.roles.filter((r) => allowedRoles.includes(r));
  const hasAccess = allowedRoles.includes(role!);
  console.log(role);
  console.log(hasAccess);
  // if (hasAccess.length === 0) {
  //   return <Navigate to="/unauthorized" replace />;
  // }
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }


  return children;
}
