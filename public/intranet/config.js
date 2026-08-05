window.ROVIX_HUB_CONFIG = {
  APP_NAME: "Rovix Hub",
  APP_VERSION: "1.0.0",
  API_BASE_URL: "https://tag-1-xfzk.onrender.com",
  TAG_ADMIN_URL: "https://tag-admin.onrender.com/",
  STORAGE_KEYS: {
    authToken: "tagcheck_admin_auth_token",
    authUser: "tagcheck_admin_auth_user"
  },
  ENDPOINTS: {
    login: "/auth/login",
    health: "/health"
  },
  SYSTEMS: [
    {
      group: "TAGCheck",
      icon: "🏷️",
      items: [
        {
          name: "TAGCheck Admin",
          description: "Administração, cadastro e gestão de equipamentos.",
          url: "https://tag-admin.onrender.com/",
          badge: "Admin"
        },
        {
          name: "TAGCheck Viewer",
          description: "Consulta pública por TAG ou QR Code.",
          url: "https://tag-viewer.onrender.com/",
          badge: "Viewer"
        },
        {
          name: "TAGCheck Campo",
          description: "Cadastro de campo e apoio operacional.",
          url: "https://tagcheck-campo.onrender.com/",
          badge: "Campo"
        }
      ]
    },
    {
      group: "AmigoPet",
      icon: "🐶",
      items: [
        {
          name: "AmigoPet Admin",
          description: "Painel administrativo da plataforma AmigoPet.",
          url: "https://amigopet-6td8.onrender.com/admin",
          badge: "Admin"
        },
        {
          name: "AmigoPet Cliente",
          description: "Área do cliente/tutor.",
          url: "https://amigopet-6td8.onrender.com/",
          badge: "Cliente"
        },
        {
          name: "AmigoPet Walker",
          description: "Área do passeador.",
          url: "https://amigopet-6td8.onrender.com/passeador",
          badge: "Walker"
        }
      ]
    },
    {
      group: "Rovix",
      icon: "🚀",
      items: [
        {
          name: "Rovix Control",
          description: "Controle de calibração, ativos e monitoramento. Em desenvolvimento.",
          url: "#",
          badge: "Em desenvolvimento",
          disabled: true
        },
        {
          name: "Rovix AI",
          description: "Automação inteligente e assistentes digitais. Em desenvolvimento.",
          url: "#",
          badge: "Em desenvolvimento",
          disabled: true
        },
        {
          name: "Rovix Cloud",
          description: "Hospedagem, deploy, backups e infraestrutura. Em desenvolvimento.",
          url: "#",
          badge: "Em desenvolvimento",
          disabled: true
        }
      ]
    }
  ]
};
