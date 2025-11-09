# ========================================
# Frontend MSMK Voice Assistant - Dockerfile
# ========================================
# Servidor web simple para servir archivos estáticos
# ========================================

FROM nginx:alpine

# Metadata
LABEL maintainer="MSMK Voice Assistant"
LABEL description="MSMK Voice Assistant Frontend"
LABEL version="1.0.0"

# Copiar archivos estáticos
COPY frontend/ /usr/share/nginx/html/

# Crear directorio para certificados SSL
RUN mkdir -p /etc/nginx/ssl

# Copiar certificados SSL si existen
# Si el directorio ssl/ existe y tiene archivos, se copiarán
# Si no existe, Docker fallará, así que usamos un enfoque diferente:
# Copiamos todo el directorio frontend que ya incluye ssl/ si existe
# Luego movemos los certificados si están presentes
RUN if [ -d /usr/share/nginx/html/ssl ] && [ -f /usr/share/nginx/html/ssl/server.crt ] && [ -f /usr/share/nginx/html/ssl/server.key ]; then \
        cp /usr/share/nginx/html/ssl/server.crt /usr/share/nginx/html/ssl/server.key /etc/nginx/ssl/ && \
        rm -rf /usr/share/nginx/html/ssl; \
    fi

# Configuración de nginx para SPA con HTTPS
RUN if [ -f /etc/nginx/ssl/server.crt ]; then \
    echo 'server { \
        listen 0.0.0.0:80; \
        listen [::]:80; \
        server_name _; \
        return 301 https://$host$request_uri; \
    } \
    server { \
        listen 0.0.0.0:443 ssl http2; \
        listen [::]:443 ssl http2; \
        server_name _; \
        ssl_certificate /etc/nginx/ssl/server.crt; \
        ssl_certificate_key /etc/nginx/ssl/server.key; \
        ssl_protocols TLSv1.2 TLSv1.3; \
        ssl_ciphers HIGH:!aNULL:!MD5; \
        root /usr/share/nginx/html; \
        index index.html; \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
        location /api { \
            proxy_pass http://backend:8000; \
            proxy_set_header Host $host; \
            proxy_set_header X-Real-IP $remote_addr; \
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
            proxy_set_header X-Forwarded-Proto $scheme; \
        } \
    }' > /etc/nginx/conf.d/default.conf; \
    else \
    echo 'server { \
        listen 0.0.0.0:80; \
        listen [::]:80; \
        server_name _; \
        root /usr/share/nginx/html; \
        index index.html; \
        location / { \
            try_files $uri $uri/ /index.html; \
        } \
        location /api { \
            proxy_pass http://backend:8000; \
            proxy_set_header Host $host; \
            proxy_set_header X-Real-IP $remote_addr; \
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        } \
    }' > /etc/nginx/conf.d/default.conf; \
    fi

# Exponer puertos
EXPOSE 80 443

# Healthcheck
# Nota: wget viene preinstalado en nginx:alpine
# Usar 127.0.0.1 explícitamente para evitar problemas con IPv6
HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=10s \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]

