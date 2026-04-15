// Auth is handled by Cloudflare Zero Trust at the infrastructure level.
// No app-level auth needed — just like ruecken-rehab.
export function useAuth() {
  return { user: { name: "Lucas", login: "Mentalustig", avatar: "https://github.com/Mentalustig.png" }, login: () => {}, logout: () => {}, loading: false };
}
