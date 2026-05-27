import Header from "./components/Header"
import Home from "./pages/Home"
import Product from "./pages/Product"
import Favorites from "./pages/Favorites"
import Profile from "./pages/Profile"
import Bag from "./pages/Bag"
import Address from "./pages/Address"
import Payment from "./pages/Payment"
import OrderSuccess from "./pages/OrderSuccess"
import OrderDetail from "./pages/OrderDetail"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Category from "./pages/Category"
import Search from "./pages/Search"
import Quiz from "./pages/Quiz"
import Admin from "./pages/Admin"

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { CartProvider } from "./contexts/CartContext"

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Header />

        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produto/:id" element={<Product />} />
        <Route path="/favoritos" element={<Favorites />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/sacola" element={<Bag />} />
        <Route path="/endereco" element={<Address />} />
        <Route path="/pagamento" element={<Payment />} />
        <Route path="/pedido-concluido" element={<OrderSuccess />} />
        <Route path="/pedidos/:id" element={<OrderDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/categoria/:categoria" element={<Category />} />
        <Route path="/busca" element={<Search />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App