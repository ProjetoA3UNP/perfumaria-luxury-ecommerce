import { Link } from "react-router-dom"

function NotFound() {
  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      backgroundColor: '#fdfcfd',
      padding: '40px 20px',
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        padding: '50px 30px',
        borderRadius: '24px',
        backgroundColor: '#fff',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
        border: '1px solid #f3e8ee'
      }}>
        {/* Ícone de Perfume com fumaça/evaporação */}
        <div style={{ 
          fontSize: '70px', 
          marginBottom: '25px', 
          display: 'inline-block',
          animation: 'float 3s ease-in-out infinite'
        }}>
          🧴💨
        </div>
        
        {/* CSS inline para animação simples */}
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
        `}</style>

        <h1 style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '80px',
          margin: '0 0 10px 0',
          color: '#8c2b53',
          lineHeight: '1',
          letterSpacing: '-2px'
        }}>
          404
        </h1>

        <h2 style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '18px',
          textTransform: 'uppercase',
          color: '#555',
          margin: '0 0 20px 0',
          letterSpacing: '1px',
          lineHeight: '1.4'
        }}>
          Esta fragrância parece ter evaporado
        </h2>

        <p style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: '#888',
          lineHeight: '1.6',
          margin: '0 0 35px 0'
        }}>
          A página que você está procurando não existe, foi removida ou teve seu endereço alterado.
        </p>

        <Link 
          to="/" 
          style={{
            display: 'inline-block',
            backgroundColor: '#8c2b53',
            color: 'white',
            textDecoration: 'none',
            padding: '14px 40px',
            borderRadius: '12px',
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '15px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            transition: 'background-color 0.2s, transform 0.2s',
            boxShadow: '0 4px 12px rgba(140, 43, 83, 0.15)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#721e41';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#8c2b53';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          Voltar para a Essence
        </Link>
      </div>
    </section>
  )
}

export default NotFound
