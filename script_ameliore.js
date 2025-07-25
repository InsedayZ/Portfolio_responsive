// ===== PORTFOLIO AMÉLIORÉ JAVASCRIPT =====

// Configuration globale
const CONFIG = {
  animationDuration: 300,
  scrollOffset: 80,
  debounceDelay: 100,
  intersectionThreshold: 0.1
};

// ===== UTILITAIRES =====
const utils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  smoothScrollTo(element, offset = CONFIG.scrollOffset) {
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
  },

  toggleClass(el, cls, add = true) {
    el.classList[add ? 'add' : 'remove'](cls);
  }
};

// ===== NAVIGATION =====
class Navigation {
  constructor() {
    this.navbar    = document.querySelector('.navbar');
    this.navToggle = document.querySelector('.nav-toggle');
    this.navLinks  = document.querySelector('.nav-links');
    this.navItems  = document.querySelectorAll('.nav-links a');
    this.init();
  }

  init() {
    this.navToggle?.addEventListener('click', () => this.toggleMobileMenu());
    this.navItems.forEach(link => {
      link.addEventListener('click', e => this.handleNavClick(e));
    });
    document.addEventListener('click', e => {
      if (this.navLinks.classList.contains('active')
        && !this.navbar.contains(e.target)) {
        this.toggleMobileMenu(false);
      }
    });
    window.addEventListener('scroll',
      utils.debounce(() => {
        utils.toggleClass(this.navbar, 'scrolled', window.scrollY > 50);
      }, CONFIG.debounceDelay)
    );
    this.initSectionObserver();
  }

  toggleMobileMenu(force) {
    const open = typeof force === 'boolean' ? force : !this.navLinks.classList.contains('active');
    utils.toggleClass(this.navToggle, 'active', open);
    utils.toggleClass(this.navLinks, 'active', open);
    this.navToggle.setAttribute('aria-expanded', open);
  }

  handleNavClick(e) {
    e.preventDefault();
    const id = e.currentTarget.getAttribute('href');
    const target = document.querySelector(id);
    if (target) {
      utils.smoothScrollTo(target);
      history.pushState(null, '', id);
      this.toggleMobileMenu(false);
    }
  }

  initSectionObserver() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-links a');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          active?.classList.add('active');
        }
      });
    }, {
      threshold: CONFIG.intersectionThreshold,
      rootMargin: `-${CONFIG.scrollOffset}px 0px -50% 0px`
    });
    sections.forEach(s => obs.observe(s));
  }
}

// ===== FILTRE DES COMPÉTENCES =====
class SkillsFilter {
  constructor() {
    this.buttons = document.querySelectorAll('.filter-btn');
    this.cards   = document.querySelectorAll('.skill-card');
    this.init();
  }

  init() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', e => this.filter(e.currentTarget));
      btn.addEventListener('keydown', e => {
        if (['Enter',' '].includes(e.key)) {
          e.preventDefault();
          this.filter(e.currentTarget);
        }
      });
    });
  }

  filter(button) {
    const filter = button.dataset.filter;
    this.buttons.forEach(b => {
      b.classList.toggle('active', b===button);
      b.setAttribute('aria-selected', b===button);
    });
    this.cards.forEach((card, i) => {
      const show = filter==='all' || card.classList.contains(filter);
      card.style.transition = `all ${CONFIG.animationDuration}ms ease-out`;
      card.style.opacity = show? '1':'0';
      card.style.transform = show? 'scale(1)':'scale(0.8)';
      setTimeout(() => card.style.display = show? 'block':'none', CONFIG.animationDuration);
    });
  }
}

// ===== NAVIGATION PORTFOLIO HORIZONTAL =====
class PortfolioNavigation {
  constructor() {
    this.container = document.querySelector('.portfolio-scroll');
    this.cards = document.querySelectorAll('.project-card');
    this.prevBtn = document.querySelector('.nav-prev');
    this.nextBtn = document.querySelector('.nav-next');
    this.dots = document.querySelectorAll('.nav-dot');
    this.currentIndex = 0;
    this.init();
  }

  init() {
    if (!this.container || !this.cards.length) return;

    // Navigation par boutons
    this.prevBtn?.addEventListener('click', () => this.navigate(-1));
    this.nextBtn?.addEventListener('click', () => this.navigate(1));

    // Navigation par dots
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });

    // Navigation par clavier
    this.container.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);
    });

    // Défilement tactile et souris
    this.initTouchNavigation();
    
    // Observer pour mettre à jour l'index actuel
    this.initScrollObserver();

    // Mise à jour initiale
    this.updateNavigation();
  }

  navigate(direction) {
    const newIndex = Math.max(0, Math.min(this.cards.length - 1, this.currentIndex + direction));
    this.goToSlide(newIndex);
  }

  goToSlide(index) {
    if (index < 0 || index >= this.cards.length) return;
    
    this.currentIndex = index;
    const card = this.cards[index];
    const containerRect = this.container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    
    // Calculer la position de défilement pour centrer la carte
    const scrollLeft = this.container.scrollLeft + cardRect.left - containerRect.left - 
                      (containerRect.width - cardRect.width) / 2;
    
    this.container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });

    this.updateNavigation();
  }

  updateNavigation() {
    // Mettre à jour les boutons
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex === 0;
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex === this.cards.length - 1;
    }

    // Mettre à jour les dots
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }

  initTouchNavigation() {
    let startX = 0;
    let scrollLeft = 0;
    let isDown = false;

    this.container.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - this.container.offsetLeft;
      scrollLeft = this.container.scrollLeft;
      this.container.style.cursor = 'grabbing';
    });

    this.container.addEventListener('mouseleave', () => {
      isDown = false;
      this.container.style.cursor = 'grab';
    });

    this.container.addEventListener('mouseup', () => {
      isDown = false;
      this.container.style.cursor = 'grab';
    });

    this.container.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - this.container.offsetLeft;
      const walk = (x - startX) * 2;
      this.container.scrollLeft = scrollLeft - walk;
    });

    // Support tactile
    this.container.addEventListener('touchstart', e => {
      startX = e.touches[0].pageX;
      scrollLeft = this.container.scrollLeft;
    });

    this.container.addEventListener('touchmove', e => {
      if (!startX) return;
      const x = e.touches[0].pageX;
      const walk = (startX - x) * 2;
      this.container.scrollLeft = scrollLeft + walk;
    });
  }

  initScrollObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const index = Array.from(this.cards).indexOf(entry.target);
          if (index !== -1 && index !== this.currentIndex) {
            this.currentIndex = index;
            this.updateNavigation();
          }
        }
      });
    }, {
      root: this.container,
      threshold: 0.5
    });

    this.cards.forEach(card => observer.observe(card));
  }
}

// ===== ANIMATIONS & AOS =====
class ScrollAnimations {
  constructor() {
    if (window.AOS) {
      AOS.init({ 
        duration: 800, 
        easing: 'ease-out-cubic', 
        once: true, 
        offset: 100,
        disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      });
    } else {
      this.initFallbackAnimations();
    }
  }

  initFallbackAnimations() {
    const elems = document.querySelectorAll('[data-aos]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('aos-animate');
        }
      });
    }, { 
      threshold: 0.1, 
      rootMargin: '0px 0px -50px 0px' 
    });
    elems.forEach(el => obs.observe(el));
  }
}

// ===== EFFETS VISUELS =====
class VisualEffects {
  constructor() {
    this.initParallax();
    this.initHover();
    this.initScrollIndicator();
    this.initImageLazyLoading();
  }

  initParallax() {
    const elems = document.querySelectorAll('.portrait-glow, .side-decoration');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    window.addEventListener('scroll', utils.debounce(() => {
      const y = window.pageYOffset * -0.3;
      elems.forEach(el => {
        el.style.transform = `translate(-50%, calc(-50% + ${y}px))`;
      });
    }, 10));
  }

  initHover() {
    // Effets hover sur les cartes de compétences
    document.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          card.style.transform = 'translateY(-5px) rotateX(5deg)';
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // Effet 3D sur le portrait
    const portrait = document.querySelector('.portrait-image');
    if (portrait && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const container = portrait.parentElement;
      container.addEventListener('mousemove', e => {
        const rect = portrait.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        portrait.style.transform = `perspective(1000px) rotateX(${y * 10}deg) rotateY(${x * -10}deg) scale(1.05)`;
      });
      container.addEventListener('mouseleave', () => {
        portrait.style.transform = '';
      });
    }
  }

  initScrollIndicator() {
    const indicator = document.querySelector('.scroll-indicator');
    if (!indicator) return;

    // Fade out au scroll
    window.addEventListener('scroll', () => {
      const opacity = Math.max(0, 1 - window.pageYOffset / 300);
      indicator.style.opacity = opacity;
    });

    // Click pour scroller vers À propos
    indicator.addEventListener('click', () => {
      const about = document.querySelector('#about');
      if (about) {
        utils.smoothScrollTo(about);
      }
    });
  }

  initImageLazyLoading() {
    // Lazy loading pour les images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Gestion des erreurs d'images
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => {
        img.classList.add('error');
        console.warn(`Erreur de chargement d'image: ${img.src}`);
      });
    });
  }
}

// ===== ACCESSIBILITÉ =====
class AccessibilityEnhancer {
  constructor() {
    this.initKeyboardNavigation();
    this.initFocusManagement();
    this.initScreenReaderSupport();
    this.initReducedMotion();
    this.initColorContrastCheck();
  }

  initKeyboardNavigation() {
    // Navigation clavier améliorée
    document.addEventListener('keydown', e => {
      // Échapper ferme les menus
      if (e.key === 'Escape') {
        const activeMenu = document.querySelector('.nav-links.active');
        if (activeMenu) {
          const toggle = document.querySelector('.nav-toggle');
          toggle?.click();
        }
      }
    });

    // Support Enter et Space pour les éléments interactifs
    document.querySelectorAll('button, [role="button"]').forEach(el => {
      el.addEventListener('keydown', e => {
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          el.click();
        }
      });
    });
  }

  initFocusManagement() {
    // Gestion du focus visible
    document.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Amélioration du focus sur les éléments interactifs
    document.querySelectorAll('a, button, [tabindex]').forEach(el => {
      el.addEventListener('focus', () => {
        el.classList.add('focused');
        // Annoncer le focus aux lecteurs d'écran
        if (el.getAttribute('aria-label')) {
          this.announceToScreenReader(`Focus sur ${el.getAttribute('aria-label')}`);
        }
      });
      el.addEventListener('blur', () => el.classList.remove('focused'));
    });
  }

  initScreenReaderSupport() {
    // Fonction pour annoncer aux lecteurs d'écran
    window.announceToScreenReader = (message) => {
      const announcement = document.createElement('div');
      announcement.className = 'sr-only';
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    };

    // Annoncer les changements de section
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const title = entry.target.querySelector('h2, h1');
          if (title) {
            this.announceToScreenReader(`Section ${title.textContent}`);
          }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('section[id]').forEach(section => {
      sectionObserver.observe(section);
    });
  }

  initReducedMotion() {
    // Respect des préférences de mouvement réduit
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--transition-base', '0s');
      document.documentElement.style.setProperty('--transition-fast', '0s');
      document.documentElement.style.setProperty('--transition-slow', '0s');
      
      // Désactiver les animations CSS
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  initColorContrastCheck() {
    // Vérification basique du contraste (développement)
    if (process?.env?.NODE_ENV === 'development') {
      const checkContrast = (element) => {
        const style = window.getComputedStyle(element);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        
        // Log pour le développement
        if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
          console.log(`Contraste à vérifier: ${textColor} sur ${bgColor}`, element);
        }
      };

      document.querySelectorAll('*').forEach(checkContrast);
    }
  }

  announceToScreenReader(message) {
    if (window.announceToScreenReader) {
      window.announceToScreenReader(message);
    }
  }
}

// ===== OPTIMISATIONS PERFORMANCE =====
class PerformanceOptimizer {
  constructor() {
    this.initLazyLoading();
    this.initImageOptimization();
    this.initFontPreloading();
    this.initServiceWorker();
  }

  initLazyLoading() {
    // Lazy loading pour les éléments non critiques
    const lazyElements = document.querySelectorAll('[data-lazy]');
    const lazyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          element.classList.add('loaded');
          lazyObserver.unobserve(element);
        }
      });
    });

    lazyElements.forEach(el => lazyObserver.observe(el));
  }

  initImageOptimization() {
    // Optimisation des images
    document.querySelectorAll('img').forEach(img => {
      // Préchargement des images importantes
      if (img.dataset.preload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
      }

      // Gestion des erreurs
      img.addEventListener('error', () => {
        img.style.display = 'none';
        console.warn(`Image non trouvée: ${img.src}`);
      });
    });
  }

  initFontPreloading() {
    // Préchargement des polices critiques
    const fonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
      'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap'
    ];

    fonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = fontUrl;
      document.head.appendChild(link);
    });
  }

  initServiceWorker() {
    // Service Worker pour la mise en cache (optionnel)
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker enregistré:', registration);
        })
        .catch(error => {
          console.log('Erreur Service Worker:', error);
        });
    }
  }
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialisation des icônes Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // Initialisation des modules
  try {
    new Navigation();
    new SkillsFilter();
    new PortfolioNavigation();
    new ScrollAnimations();
    new VisualEffects();
    new AccessibilityEnhancer();
    new PerformanceOptimizer();
    
    console.log('✅ Portfolio initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
});

// ===== GESTION GLOBALE DES ERREURS =====
window.addEventListener('error', e => {
  console.error('Erreur JavaScript:', e.error);
  // En production, envoyer l'erreur à un service de monitoring
});

window.addEventListener('unhandledrejection', e => {
  console.error('Promise rejetée:', e.reason);
  e.preventDefault(); // Empêche l'affichage dans la console
});

// ===== UTILITAIRES GLOBAUX =====
window.portfolioUtils = {
  // Fonction pour scroller vers une section
  scrollToSection: (sectionId) => {
    const section = document.querySelector(sectionId);
    if (section) {
      utils.smoothScrollTo(section);
    }
  },

  // Fonction pour annoncer aux lecteurs d'écran
  announce: (message) => {
    if (window.announceToScreenReader) {
      window.announceToScreenReader(message);
    }
  },

  // Fonction pour vérifier si les animations sont réduites
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};
