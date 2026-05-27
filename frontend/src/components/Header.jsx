import "./header.css"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useState, useContext, useEffect } from "react"
import { CartContext } from "../contexts/CartContext"
import api from "../services/api"
import logo from "../assets/logo1.png"

function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { quantidadeItens, quantidadeFavoritos } = useContext(CartContext)
  const [busca, setBusca] = useState("")
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [catalogo, setCatalogo] = useState([])
  const [menuAberto, setMenuAberto] = useState(false)
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false)
  const [submenuAberto, setSubmenuAberto] = useState(null)

  function gerarSlug(texto) {
    if (!texto) return ""
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const [menus, setMenus] = useState([
    { titulo: "Perfumes", subgrupos: [
      { subtitulo: "Perfumaria", opcoes: [] },
      { subtitulo: "Família Olfativa", opcoes: [] },
      { subtitulo: "Marcas", opcoes: [] },
    ]},
    { titulo: "Corpo e Banho", opcoes: [] },
    { titulo: "Presentes", opcoes: [] },
    { titulo: "Promoção", opcoes: [] },
    { titulo: "Perfume Ideal", opcoes: [{ nome: "Fazer Quiz", slug: "quiz", rota: "/quiz" }] },
  ])

  // Abas do menu horizontal simplificado (MOBILE)
  const abasHorizontais = [
    { titulo: "Perfumes", rota: "/categoria/perfumes" },
    { titulo: "Corpo e Banho", rota: "/categoria/corpo-e-banho" },
    { titulo: "Presentes", rota: "/categoria/presentes" },
    { titulo: "Promoção", rota: "/categoria/promocao" },
    { titulo: "Perfume Ideal", rota: "/quiz" },
  ]

  // Menu desktop com abas separadas (Perfumaria, Família, Marcas individualmente)
  const [menusDesktop, setMenusDesktop] = useState([
    { titulo: "Perfumaria", opcoes: [] },
    { titulo: "Família Olfativa", opcoes: [] },
    { titulo: "Marcas", opcoes: [] },
    { titulo: "Corpo e Banho", opcoes: [] },
    { titulo: "Presentes", opcoes: [] },
    { titulo: "Promoção", opcoes: [] },
    { titulo: "Perfume Ideal", opcoes: [{ nome: "Fazer Quiz", slug: "quiz", rota: "/quiz" }] },
  ])

  useEffect(() => {
    async function carregarDados() {
      try {
        const [catResponse, menuResponse] = await Promise.all([
          api.get("/products"),
          api.get("/products/menu-filters")
        ])
        
        setCatalogo(catResponse.data)
        
        const data = menuResponse.data
        setMenus([
          {
            titulo: "Perfumes",
            subgrupos: [
              {
                subtitulo: "Perfumaria",
                opcoes: data.categorias.filter(c => c.toLowerCase() !== "indie").map(c => ({ nome: c, slug: gerarSlug(c) }))
              },
              {
                subtitulo: "Família Olfativa",
                opcoes: data.familias.map(f => ({ nome: f, slug: gerarSlug(f) }))
              },
              {
                subtitulo: "Marcas",
                opcoes: data.marcas.map(m => ({ nome: m, slug: gerarSlug(m) }))
              },
            ]
          },
          {
            titulo: "Corpo e Banho",
            opcoes: [
              { nome: "Sabonetes", slug: "sabonetes" },
              { nome: "Hidratantes", slug: "hidratantes" },
            ]
          },
          {
            titulo: "Presentes",
            opcoes: [
              { nome: "Kits", slug: "kits" },
              { nome: "Até R$100", slug: "ate-100" },
            ]
          },
          {
            titulo: "Perfume Ideal",
            opcoes: [{ nome: "Fazer Quiz", slug: "quiz", rota: "/quiz" }],
          }
        ])

        // Menu desktop com abas separadas
        setMenusDesktop([
          {
            titulo: "Perfumaria",
            opcoes: data.categorias.filter(c => c.toLowerCase() !== "indie").map(c => ({ nome: c, slug: gerarSlug(c) }))
          },
          {
            titulo: "Família Olfativa",
            opcoes: data.familias.map(f => ({ nome: f, slug: gerarSlug(f) }))
          },
          {
            titulo: "Marcas",
            opcoes: data.marcas.map(m => ({ nome: m, slug: gerarSlug(m) }))
          },
          {
            titulo: "Corpo e Banho",
            opcoes: [
              { nome: "Sabonetes", slug: "sabonetes" },
              { nome: "Hidratantes", slug: "hidratantes" },
            ]
          },
          {
            titulo: "Presentes",
            opcoes: [
              { nome: "Kits", slug: "kits" },
              { nome: "Até R$100", slug: "ate-100" },
            ]
          },
          {
            titulo: "Perfume Ideal",
            opcoes: [{ nome: "Fazer Quiz", slug: "quiz", rota: "/quiz" }],
          }
        ])

      } catch (e) {
        console.error("Erro na busca do header", e)
      }
    }
    carregarDados()
  }, [])

  const isLogado = !!localStorage.getItem("usuarioLogado")
  const linkUsuario = isLogado ? "/perfil" : "/login"

  const sugestoes = catalogo.filter((produto) => {
    const texto = `
      ${produto.nome}
      ${produto.marca || ""}
      ${produto.descricao || ""}
      ${produto.familia_olfativa || ""}
      ${produto.categoria || ""}
    `.toLowerCase()

    return busca.trim() !== "" && texto.includes(busca.toLowerCase())
  })

  function pesquisar(event) {
    event.preventDefault()

    if (busca.trim() !== "") {
      navigate(`/busca?q=${encodeURIComponent(busca.trim())}`)
      setBusca("")
      setMostrarSugestoes(false)
      setBuscaMobileAberta(false)
    }
  }

  function abrirProduto(id) {
    navigate(`/produto/${id}`)
    setBusca("")
    setMostrarSugestoes(false)
    setBuscaMobileAberta(false)
  }

  // Fecha o menu hamburguer ao navegar
  useEffect(() => {
    setMenuAberto(false)
    setSubmenuAberto(null)
  }, [location.pathname])

  // Helper que retorna JSX do formulário de busca (NÃO é um componente React)
  function renderSearchForm(extraClass) {
    return (
      <form className={`search-form ${extraClass || ''}`} onSubmit={pesquisar}>
        <span className="search-lupa">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          className="search"
          type="text"
          placeholder="Buscar perfumes..."
          value={busca}
          onChange={(event) => {
            setBusca(event.target.value)
            setMostrarSugestoes(true)
          }}
          onFocus={() => setMostrarSugestoes(true)}
        />
        <button 
          type="button" 
          onClick={() => {
            setBusca('')
            setMostrarSugestoes(false)
          }} 
          className="search-clear">
          ✕
        </button>

        {mostrarSugestoes && busca.trim() !== "" && (
          <div className="search-suggestions">
            {sugestoes.length === 0 ? (
              <p>Nenhum perfume encontrado</p>
            ) : (
              sugestoes.slice(0, 5).map((produto) => (
                <button
                  type="button"
                  key={produto.id}
                  onClick={() => abrirProduto(produto.id)}
                >
                  <img src={produto.imagem} alt={produto.nome} />
                  <span>
                    <strong>{produto.nome}</strong>
                    <small>{produto.marca}</small>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </form>
    )
  }

  // Helper que retorna JSX dos ícones (NÃO é um componente React)
  function renderIcons() {
    return (
      <>
        <Link to="/favoritos" className="cart-icon-container">
          <svg 
            className="icon-img" 
            viewBox="0 0 24 24" 
            fill={location.pathname === '/favoritos' ? "black" : "none"} 
            stroke="black" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ display: 'block' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {quantidadeFavoritos > 0 && <span className="cart-badge">{quantidadeFavoritos}</span>}
        </Link>

        <Link to={linkUsuario}>
          <svg 
            className={`icon-img ${isLogado ? 'logged-in' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="black" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            title={isLogado ? "Meu Perfil" : "Fazer Login"}
            style={{ display: 'block' }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </Link>

        <Link to="/sacola" className="cart-icon-container" style={{ position: 'relative' }}>
          <svg 
            className="icon-img" 
            viewBox="0 0 24 24" 
            fill={location.pathname === '/sacola' ? "black" : "none"} 
            stroke="black" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ display: 'block' }}
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {quantidadeItens > 0 && <span className="cart-badge">{quantidadeItens}</span>}
        </Link>

        {isLogado && (
          <button 
            onClick={() => {
              localStorage.removeItem("usuarioLogado");
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            title="Sair"
            className="logout-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        )}
      </>
    )
  }

  return (
    <header className="header">
      {/* ===== TOP BAR ===== */}
      <div className="top-bar">
        {/* MOBILE: Hamburger à esquerda */}
        <button className="hamburger" onClick={() => setMenuAberto(!menuAberto)} aria-label="Menu">
          {menuAberto ? '✕' : '☰'}
        </button>

        {/* Logo */}
        <Link to="/" className="logo-link">
          <img src={logo} alt="Essence" className="logo-img" />
        </Link>

        {/* DESKTOP: Search + Icons */}
        <div className="header-right desktop-only">
          {renderSearchForm()}
          <div className="icons">
            {renderIcons()}
          </div>
        </div>

        {/* MOBILE: Lupa toggle + Icons */}
        <div className="mobile-icons mobile-only">
          <button className="search-toggle" onClick={() => setBuscaMobileAberta(!buscaMobileAberta)} aria-label="Buscar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          {renderIcons()}
        </div>
      </div>


      {/* ===== MOBILE: Barra de busca expansível ===== */}
      {buscaMobileAberta && (
        <div className="mobile-search-bar mobile-only">
          {renderSearchForm("mobile-search-form")}
        </div>
      )}

      {/* ===== MENU HORIZONTAL (abas simplificadas — sempre visível) ===== */}
      <nav className="menu-horizontal">
        {abasHorizontais.map((aba) => (
          <Link
            key={aba.titulo}
            to={aba.rota}
            className="menu-horizontal-link"
          >
            {aba.titulo}
          </Link>
        ))}
      </nav>

      {/* ===== HAMBURGER OVERLAY (sidebar com subcategorias accordion) ===== */}
      {menuAberto && <div className="hamburger-overlay" onClick={() => setMenuAberto(false)} />}
      
      <div className={`hamburger-panel ${menuAberto ? 'open' : ''}`}>
        <div className="hamburger-header">
          <img src={logo} alt="Essence" className="hamburger-logo" />
          <button className="hamburger-close" onClick={() => setMenuAberto(false)}>✕</button>
        </div>

        <div className="hamburger-body">
          {menus.map((menu) => (
            <div className="hamburger-item" key={menu.titulo}>
              <button
                className="hamburger-category"
                onClick={() => setSubmenuAberto(submenuAberto === menu.titulo ? null : menu.titulo)}
              >
                <span>{menu.titulo}</span>
                <span className={`hamburger-arrow ${submenuAberto === menu.titulo ? 'open' : ''}`}>›</span>
              </button>

              {submenuAberto === menu.titulo && (
                <div className="hamburger-submenu">
                  {/* Menus com subgrupos (ex: Perfumes) */}
                  {menu.subgrupos ? menu.subgrupos.map((grupo) => (
                    <div key={grupo.subtitulo}>
                      <p className="hamburger-subgroup-title">{grupo.subtitulo}</p>
                      {grupo.opcoes.map((opcao) => (
                        <Link
                          key={opcao.slug}
                          to={opcao.rota ? opcao.rota : `/categoria/${opcao.slug}`}
                          onClick={() => setMenuAberto(false)}
                        >
                          {opcao.nome}
                        </Link>
                      ))}
                    </div>
                  )) : (
                    /* Menus simples (ex: Corpo e Banho) */
                    menu.opcoes.map((opcao) => (
                      <Link
                        key={opcao.slug}
                        to={opcao.rota ? opcao.rota : `/categoria/${opcao.slug}`}
                        onClick={() => setMenuAberto(false)}
                      >
                        {opcao.nome}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== DESKTOP: Menu com hover dropdowns (escondido no mobile) ===== */}
      <nav className="menu-desktop desktop-only">
        {menusDesktop.map((menu) => (
          <div className="menu-item" key={menu.titulo}>
            <button className="menu-button">
              {menu.titulo} <span style={{ fontSize: '10px' }}>∨</span>
            </button>

            <div className="dropdown">
              {menu.opcoes.map((opcao) => (
                <Link
                  key={opcao.slug}
                  to={opcao.rota ? opcao.rota : `/categoria/${opcao.slug}`}
                >
                  {opcao.nome}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </header>
  )
}

export default Header