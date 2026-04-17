export type UserRole = "ADMIN" | "USER" | "STORE_OWNER";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "STORE_OWNER":
      return "/owner/dashboard";
    case "USER":
    default:
      return "/user/stores";
  }
}
