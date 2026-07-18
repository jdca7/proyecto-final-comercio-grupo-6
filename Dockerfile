# Imagen para servir la app estatica (index.html, css/, js/) con nginx.
# La app no necesita Node ni build alguno: es HTML/CSS/JS puro.
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

EXPOSE 80
