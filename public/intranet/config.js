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
      "group": "ROVIX",
      "icon": "🚀",
      "items": [
        {
          "name": "ROVIX Automation / ROVIX HUB",
          "description": "Plataforma central ROVIX e intranet de acesso aos sistemas e projetos.",
          "status": "PRODUÇÃO",
          "type": "Web",
          "links": [
            {
              "label": "Site",
              "url": "https://www.rovixautomation.com.br"
            },
            {
              "label": "GitHub",
              "url": "https://github.com/robbertojustinno/rovix-automation"
            }
          ]
        },
        {
          "name": "ROVIX Drive",
          "description": "Armazenamento privado administrativo da ROVIX e repositório dos arquivos associados aos produtos.",
          "status": "PREVIEW",
          "type": "Cloud / Privado",
          "links": [
            {
              "label": "Abrir Drive",
              "url": "https://rovix-drive-preview.onrender.com/cloud"
            }
          ]
        },
        {
          "name": "ROVIX Store",
          "description": "Catálogo e venda de produtos digitais, softwares e arquivos ROVIX.",
          "status": "PREVIEW",
          "type": "Web / Loja",
          "links": [
            {
              "label": "Produtos",
              "url": "https://rovix-drive-preview.onrender.com/produtos"
            },
            {
              "label": "Minhas compras",
              "url": "https://rovix-drive-preview.onrender.com/minhas-compras"
            }
          ]
        },
        {
          "name": "ROVIX Store Admin",
          "description": "Área administrativa para cadastrar produtos, preços, versões e arquivos associados.",
          "status": "PREVIEW",
          "type": "Admin / Loja",
          "links": [
            {
              "label": "Gerenciar produtos",
              "url": "https://rovix-drive-preview.onrender.com/admin/produtos"
            }
          ]
        },
        {
          "name": "ROVIX Projects",
          "description": "Central pública para apresentar projetos, ferramentas, versões e downloads liberados.",
          "status": "PREVIEW",
          "type": "Web / Projetos",
          "links": [
            {
              "label": "Projetos",
              "url": "https://rovix-drive-preview.onrender.com/projetos"
            }
          ]
        },
        {
          "name": "ROVIX Setup / System Center",
          "description": "Ferramenta Windows para instalação, configuração, diagnóstico e manutenção de computadores.",
          "status": "LOCAL",
          "type": "Desktop / Windows",
          "links": []
        },
        {
          "name": "ROVIX Screensaver / Cyber Command Center",
          "description": "Projeto visual e operacional ROVIX para Windows, incluindo screensaver e Cyber Command Center.",
          "status": "LOCAL",
          "type": "Desktop",
          "links": [
            {
              "label": "GitHub",
              "url": "https://github.com/robbertojustinno/Rovix_screensaver"
            }
          ]
        },
        {
          "name": "ROVIX OSINT",
          "description": "Plataforma ROVIX de inteligência e investigação OSINT.",
          "status": "LOCAL",
          "type": "Web / PWA",
          "links": []
        },
        {
          "name": "ROVIX Guardian",
          "description": "Plataforma modular ROVIX baseada em Python para ferramentas, plugins e operações internas.",
          "status": "LOCAL",
          "type": "Web / Ferramentas",
          "links": []
        },
        {
          "name": "ROVIX Vote",
          "description": "Sistema eletrônico de votação e treinamento eleitoral desenvolvido em Electron/React.",
          "status": "LOCAL",
          "type": "Desktop",
          "links": []
        },
        {
          "name": "ROVIX Market",
          "description": "Aplicação ROVIX desenvolvida em React, TypeScript, PWA e Capacitor.",
          "status": "LOCAL",
          "type": "Web / Mobile",
          "links": []
        },
        {
          "name": "ROVIX AI OS",
          "description": "Plataforma experimental ROVIX de inteligência artificial baseada em Python/FastAPI.",
          "status": "DESENVOLVIMENTO",
          "type": "IA / Web",
          "links": []
        }
      ]
    },
    {
      "group": "AUTOMAÇÃO INDUSTRIAL",
      "icon": "⚙️",
      "items": [
        {
          "name": "ROVIX UAP",
          "description": "Universal Automation Protocol — Protocolo de comunicação industrial desenvolvido pela ROVIX para integração entre equipamentos e redes industriais.",
          "status": "DESENVOLVIMENTO",
          "type": "Automação Industrial / Protocolo",
          "links": []
        },
        {
          "name": "UAP Studio",
          "description": "Software de configuração, diagnóstico e desenvolvimento para o protocolo ROVIX UAP.",
          "status": "DESENVOLVIMENTO",
          "type": "Desktop / Automação Industrial",
          "links": []
        },
        {
          "name": "Balança Urano",
          "description": "Projeto Arduino para integração e leitura de balança industrial Urano via comunicação serial.",
          "status": "DESENVOLVIMENTO",
          "type": "Firmware / Automação",
          "links": []
        }
      ]
    },
    {
      "group": "TAGCHECK / GESTÃO INDUSTRIAL",
      "icon": "🏷️",
      "items": [
        {
          "name": "TAGCheck",
          "description": "Sistema ROVIX de identificação, controle e gestão de equipamentos industriais através de tags e QR Code.",
          "status": "PRODUÇÃO",
          "type": "Web / Industrial",
          "links": [
            {
              "label": "Admin",
              "url": "https://tag-admin.onrender.com/"
            },
            {
              "label": "Viewer",
              "url": "https://tag-viewer.onrender.com/"
            },
            {
              "label": "GitHub",
              "url": "https://github.com/robbertojustinno/TAG"
            }
          ]
        },
        {
          "name": "TAGCheck Campo",
          "description": "Aplicativo de campo do ecossistema TAGCheck para consulta e operação em dispositivos móveis.",
          "status": "PRODUÇÃO",
          "type": "PWA / Campo",
          "links": [
            {
              "label": "Abrir",
              "url": "https://tagcheck-campo.onrender.com/"
            },
            {
              "label": "GitHub",
              "url": "https://github.com/robbertojustinno/TAGCheck-Campo"
            }
          ]
        },
        {
          "name": "TAGCheck Fase 2",
          "description": "Nova arquitetura multiempresa do TAGCheck com usuários, empresas, unidades e controle de acesso.",
          "status": "DESENVOLVIMENTO",
          "type": "Web / SaaS",
          "links": [
            {
              "label": "Admin homologação",
              "url": "https://tagcheck-fase2-hml-admin.onrender.com"
            },
            {
              "label": "Viewer homologação",
              "url": "https://tagcheck-fase2-hml-viewer.onrender.com"
            },
            {
              "label": "API",
              "url": "https://tagcheck-fase2-hml-api.onrender.com"
            }
          ]
        },
        {
          "name": "TAGCheck Desktop",
          "description": "Cliente desktop do TAGCheck com suporte offline, sincronização e Viewer integrado.",
          "status": "DESENVOLVIMENTO",
          "type": "Desktop / Tauri",
          "links": []
        },
        {
          "name": "ALMOX / ALMOX DVAPRO",
          "description": "Sistema de controle e gestão de almoxarifado desenvolvido em Python/FastAPI.",
          "status": "LOCAL",
          "type": "Web / Gestão",
          "links": []
        }
      ]
    },
    {
      "group": "APLICATIVOS",
      "icon": "📱",
      "items": [
        {
          "name": "AmigoPet",
          "description": "Plataforma para serviços e gestão de cuidados com animais.",
          "status": "PRODUÇÃO",
          "type": "Web / Mobile",
          "links": [
            {
              "label": "Cliente",
              "url": "https://amigopet-6td8.onrender.com/"
            },
            {
              "label": "Admin",
              "url": "https://amigopet-6td8.onrender.com/admin"
            },
            {
              "label": "Walker",
              "url": "https://amigopet-6td8.onrender.com/passeador"
            },
            {
              "label": "GitHub",
              "url": "https://github.com/robbertojustinno/amigopet_app"
            },
            {
              "label": "GitHub legado",
              "url": "https://github.com/robbertojustinno/amigopet-v8"
            }
          ]
        },
        {
          "name": "Driverbel",
          "description": "Plataforma interna de transporte de funcionários inspirada em serviços de mobilidade.",
          "status": "LOCAL",
          "type": "Web / PWA",
          "links": []
        },
        {
          "name": "PresenteCerto",
          "description": "Plataforma para criação e compartilhamento de listas e sugestões de presentes.",
          "status": "DESENVOLVIMENTO",
          "type": "Web",
          "links": [
            {
              "label": "Abrir",
              "url": "https://presentecerto.onrender.com"
            }
          ]
        },
        {
          "name": "Bola de Gude",
          "description": "Jogo 3D para Android desenvolvido em Unity.",
          "status": "DESENVOLVIMENTO",
          "type": "Game / Android",
          "links": []
        },
        {
          "name": "Meu Status",
          "description": "Aplicativo mobile desenvolvido em React, Vite e Capacitor.",
          "status": "DESENVOLVIMENTO",
          "type": "Mobile",
          "links": []
        },
        {
          "name": "CrisMaj / Mahjong Bíblico",
          "description": "Jogo inspirado em Mahjong com temática cristã e versão Android.",
          "status": "DESENVOLVIMENTO",
          "type": "Game / Android",
          "links": []
        }
      ]
    },
    {
      "group": "CIPHER",
      "icon": "📖",
      "items": [
        {
          "name": "CIPHER — Protocolo Orpheus",
          "description": "Universo editorial CIPHER e primeiro livro da série Protocolo Orpheus.",
          "status": "PRODUÇÃO",
          "type": "Livro / Projeto Editorial",
          "links": []
        },
        {
          "name": "ORPHEUS",
          "description": "Aplicativo companion de CIPHER com terminal, enigmas, missões e conteúdo interativo.",
          "status": "DESENVOLVIMENTO",
          "type": "Desktop / Tauri",
          "links": [
            {
              "label": "GitHub",
              "url": "https://github.com/robbertojustinno/orpheus-cipher"
            }
          ]
        }
      ]
    },
    {
      "group": "LABORATÓRIO",
      "icon": "🧪",
      "items": [
        {
          "name": "COSMOS",
          "description": "Projeto experimental desktop baseado em Electron e tecnologias web.",
          "status": "LOCAL",
          "type": "Desktop / Experimental",
          "links": []
        },
        {
          "name": "MATRIX",
          "description": "Projeto experimental desenvolvido com protótipos HTML/JavaScript e Python.",
          "status": "DESENVOLVIMENTO",
          "type": "Experimental",
          "links": []
        }
      ]
    }
  ]
};
