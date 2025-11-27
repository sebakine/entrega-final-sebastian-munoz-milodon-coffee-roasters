// ==========================================
// BOTÓN VOLVER ARRIBA - SCROLL TO TOP
// ==========================================

function crearBotonVolverArriba() {
    // Crear el elemento del botón
    const botonScrollTop = document.createElement('button');
    botonScrollTop.innerHTML = '↑';
    botonScrollTop.id = 'scrollTopBtn';
    botonScrollTop.setAttribute('aria-label', 'Volver al inicio de la página');
    
    // Añadir el botón al body
    document.body.appendChild(botonScrollTop);
    
    // Mostrar/ocultar botón al hacer scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            botonScrollTop.classList.add('show');
        } else {
            botonScrollTop.classList.remove('show');
        }
    });
    
    // Scroll suave al hacer clic
    botonScrollTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==========================================
// EFECTO PARALLAX SOLO EN BANNERS HERO
// ==========================================

function efectoParallaxBanners() {
    // Solo aplicar parallax a banners específicos (NO navbar, NO alerta)
    const banners = document.querySelectorAll('.banner, .banner-interno');
    
    if (banners.length === 0) return;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.3; // Efecto suave
        
        banners.forEach(banner => {
            banner.style.transform = `translateY(${rate}px)`;
        });
    });
}

// ==========================================
// INICIALIZAR TODO CUANDO EL DOM ESTÉ LISTO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando efectos JavaScript...');
    
    // Inicializar botón volver arriba
    crearBotonVolverArriba();
    
    // Inicializar efecto parallax solo en banners
    efectoParallaxBanners();
    
    console.log('✅ Efectos JavaScript cargados correctamente');
});

// ==========================================
// MANEJO DE ERRORES
// ==========================================

window.addEventListener('error', function(e) {
    console.error('❌ Error en JavaScript:', e.error);
});