import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { setActiveRole, setUserData } from "@/context/authSlice";
import type { UserRole } from "@/types";
import { authService } from "@/features/auth/authService";

export const useOAuthHandler = (
  action: "login" | "register",
  showMessage: (title: string, mesage: string, type?: string) => void
) => {
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  // Handle OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const userId = params.get("userid");
    const role = params.getAll("role") as UserRole[];
    const roleList = role.flatMap(r => r.split(",").map(x => x.trim())) as UserRole[];
    const error = params.get("error");
    window.history.replaceState({}, document.title, url.pathname);

    if (error) {
      showMessage("OAuth authentication failed!",error, "error");
      return;
    }

    if (userId) {
      dispatch(setUserData({userid: userId, roles: roleList, ids: {userid: userId} }));
      dispatch(setActiveRole(roleList[0]));
      showMessage("OAuth authentication successful!", "Redirecting...", "success");
      setTimeout(() => {
        nav("/user/dashboard", { replace: true });
      }, 2000);
    }
  }, []);

  // Handle OAuth login/register button
  const handleOAuth = async (provider: string, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      if (provider === "google") {
        await authService.googleLogin(action);
      } else if (provider === "facebook") {
        await authService.facebookLogin(action);
      }
    } catch {
      showMessage(`OAuth ${action} failed`, "error");
    } finally {
      setLoading(false);
    }
  };

  return { handleOAuth };
};
