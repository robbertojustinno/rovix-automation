window.ROVIX_HUB_CONFIG = {
  APP_NAME: "Rovix Hub", APP_VERSION: "2.0.0",
  API_BASE_URL: "https://tag-1-xfzk.onrender.com",
  STORAGE_KEYS: { authToken: "tagcheck_admin_auth_token", authUser: "tagcheck_admin_auth_user" },
  ENDPOINTS: { login: "/auth/login", health: "/health" },
  SYSTEMS: [
    { group: "TAGCheck", icon: "🏷️", subtitle: "Smart Asset Tracking", items: [
      { name: "TAGCheck Admin", icon: "⚙️", description: "Administração, cadastro e gestão completa de instrumentos e ativos.", url: "https://tag-admin.onrender.com/", badge: "Admin", featured: true },
      { name: "TAGCheck Viewer", icon: "◉", description: "Consulta rápida de instrumentos por TAG ou leitura de QR Code.", url: "https://tag-viewer.onrender.com/", badge: "Viewer" },
      { name: "TAGCheck Campo", icon: "📱", description: "Cadastro em campo, fotos, QR Code e operação com suporte offline.", url: "https://tagcheck-campo.onrender.com/", badge: "Campo", featured: true }
    ]},
    { group: "AmigoPet", icon: "🐾", subtitle: "Serviços e cuidados para pets", items: [
      { name: "AmigoPet Admin", icon: "🛠️", description: "Painel administrativo e gestão da plataforma AmigoPet.", url: "https://amigopet-6td8.onrender.com/admin", badge: "Admin" },
      { name: "AmigoPet Cliente", icon: "🐶", description: "Área do tutor para solicitar e acompanhar serviços.", url: "https://amigopet-6td8.onrender.com/", badge: "Cliente" },
      { name: "AmigoPet Passeador", icon: "🚶", description: "Área operacional dos profissionais e passeadores.", url: "https://amigopet-6td8.onrender.com/passeador", badge: "Profissional" }
    ]},
    { group: "Rovix Labs", icon: "🚀", subtitle: "Próximas soluções do ecossistema", items: [
      { name: "Guardian", icon: "🛡️", description: "Segurança, scanner, relatórios e inteligência local.", url: "#", badge: "Em evolução", disabled: true },
      { name: "ALMOX", icon: "📦", description: "Gestão local de estoque, materiais, equipamentos e movimentações.", url: "#", badge: "Em evolução", disabled: true },
      { name: "Rovix AI", icon: "🤖", description: "Automação inteligente, assistentes e integração entre sistemas.", url: "#", badge: "Planejado", disabled: true }
    ]}
  ]
};
