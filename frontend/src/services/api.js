import axios from "axios";

// Configuração Base do Axios apontando para o Servidor Node
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
});

// Interceptador Ouro: Anexa o Token JWT automaticamente antes da requisição sair
api.interceptors.request.use((config) => {
  const usuarioTexto = localStorage.getItem("usuarioLogado");
  if (usuarioTexto) {
    const usuarioLogado = JSON.parse(usuarioTexto);
    if (usuarioLogado.token) {
      config.headers.Authorization = `Bearer ${usuarioLogado.token}`;
    }
  }
  return config;
});

// Interceptador de Resposta: Trata expiração do token (401) de forma global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Ignora erro 401 se for a própria tentativa de login com credenciais incorretas
      const isLoginRequest = error.config && error.config.url && error.config.url.endsWith("/auth/login");
      
      if (!isLoginRequest) {
        const usuarioTexto = localStorage.getItem("usuarioLogado");
        if (usuarioTexto) {
          localStorage.removeItem("usuarioLogado");
          // Redireciona limpando o estado atual
          window.location.href = "/login?session_expired=true";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
