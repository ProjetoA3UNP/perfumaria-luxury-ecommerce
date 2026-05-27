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

export default api;
