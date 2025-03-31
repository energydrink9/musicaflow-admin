import { AuthBindings } from "@refinedev/core";
import { User, LogoutOptions } from "@auth0/auth0-react";

export const generateAuthProvider = (
  user: User | undefined,
  logout: (options?: LogoutOptions) => void
): AuthBindings => ({
  login: async () => ({
    success: true,
    redirectTo: "/",
  }),
  logout: async () => {
    await logout({ returnTo: window.location.origin });
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => ({
    error,
    logout: false,
    redirectTo: "/",
  }),
  check: async () => {
    if (user) {
      return {
        authenticated: true,
      };
    }
    return {
      authenticated: false,
      error: new Error("Not authenticated"),
      logout: true,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    if (user) {
      return {
        ...user,
        avatar: user.picture,
      };
    }
    return null;
  },
});
