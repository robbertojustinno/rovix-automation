ROVIX HUB V1

Arquivos inclusos:
- intranet/index.html
- intranet/styles.css
- intranet/app.js
- intranet/config.js
- intranet/public/logo.png
- intranet/public/favicon.png
- intranet.html

Como publicar no site Rovix:
1. Extraia este ZIP dentro da pasta do site rovix_site.
2. Publique no GitHub:
   git add .
   git commit -m "Adiciona Rovix Hub"
   git push

Acesso:
https://www.rovixautomation.com.br/intranet/

Login:
Use o mesmo usuário e senha do TAGCheck Admin.

Observação técnica:
Por segurança do navegador, o site da Rovix não consegue ler automaticamente a sessão/localStorage do domínio tag-admin.onrender.com.
Por isso o Hub usa o MESMO login e senha do TAG Admin, validando no mesmo backend do TAGCheck.
Depois do primeiro login, o token fica salvo no domínio da Rovix.
