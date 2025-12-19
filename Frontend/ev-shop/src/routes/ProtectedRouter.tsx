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
  const roleToCheck = typeof role === 'string' ? role.trim() : role;
  const hasAccess = allowedRoles.some(r => r === roleToCheck);
  
  console.log('ProtectedRouter Debug:', { 
    userRole: role, 
    roleToCheck,
    allowedRoles, 
    hasAccess,
    roleType: typeof role 
  });

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }


  return children;
}
