# 📤 Comandos para Subir Frontend a A.R.C.A-LLM

## Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar el script
./push-to-arca.sh
```

El script automáticamente:
- Verifica que estás en la rama `frontend-mejorado`
- Añade el remoto `arca` si no existe
- Añade todos los cambios
- Hace commit con mensaje personalizado
- Sube la rama al repositorio A.R.C.A-LLM

## Opción 2: Comandos Manuales

### 1. Verificar rama actual

```bash
git branch --show-current
```

Debe mostrar: `frontend-mejorado`

Si no estás en esa rama:
```bash
git checkout frontend-mejorado
```

### 2. Añadir remoto del repositorio A.R.C.A-LLM

```bash
# Verificar si ya existe
git remote -v

# Añadir remoto (solo la primera vez)
git remote add arca https://github.com/infantesromeroadrian/A.R.C.A-LLM.git

# Verificar que se añadió
git remote -v
```

### 3. Verificar cambios pendientes

```bash
git status
```

### 4. Añadir todos los cambios

```bash
git add .
```

### 5. Hacer commit

```bash
git commit -m "feat: frontend mejorado con integración completa a A.R.C.A-LLM

- Frontend moderno con diseño inspirado en Iron Man
- Integración completa con backend A.R.C.A-LLM
- Dockerfile multi-stage optimizado
- CI/CD con GitHub Actions
- Tests completos con Jest
- Documentación actualizada"
```

### 6. Subir al repositorio A.R.C.A-LLM

```bash
# Subir la rama frontend-mejorado
git push arca frontend-mejorado:frontend-mejorado
```

Si es la primera vez y necesitas configurar upstream:
```bash
git push -u arca frontend-mejorado
```

### 7. Verificar que se subió correctamente

```bash
# Ver las ramas remotas
git remote show arca
```

## 📋 Resumen de Comandos (Copia y Pega)

```bash
# 1. Cambiar a la rama (si no estás en ella)
git checkout frontend-mejorado

# 2. Añadir remoto (solo primera vez)
git remote add arca https://github.com/infantesromeroadrian/A.R.C.A-LLM.git

# 3. Añadir cambios
git add .

# 4. Commit
git commit -m "feat: frontend mejorado con integración completa a A.R.C.A-LLM"

# 5. Subir
git push arca frontend-mejorado:frontend-mejorado
```

## 🔍 Verificar Estado

Después de subir, puedes verificar:

```bash
# Ver ramas remotas
git branch -r

# Ver información del remoto
git remote show arca

# Ver commits en la rama
git log arca/frontend-mejorado --oneline -10
```

## 🚀 Siguiente Paso: Crear Pull Request

1. Ve a: https://github.com/infantesromeroadrian/A.R.C.A-LLM
2. Verás una notificación para crear un Pull Request desde `frontend-mejorado`
3. O manualmente:
   - Click en "Pull requests"
   - Click en "New pull request"
   - Selecciona `base: main` ← `compare: frontend-mejorado`
   - Añade descripción del PR
   - Click en "Create pull request"

## ⚠️ Solución de Problemas

### Error: "remote arca already exists"

```bash
# Ver remotos actuales
git remote -v

# Si quieres cambiar la URL del remoto
git remote set-url arca https://github.com/infantesromeroadrian/A.R.C.A-LLM.git
```

### Error: "failed to push some refs"

```bash
# Primero hacer pull (si hay cambios en el remoto)
git fetch arca
git pull arca frontend-mejorado --rebase

# Luego intentar push de nuevo
git push arca frontend-mejorado:frontend-mejorado
```

### Error: "authentication failed"

Necesitas autenticarte con GitHub:

```bash
# Opción 1: Usar token personal
git remote set-url arca https://TU_TOKEN@github.com/infantesromeroadrian/A.R.C.A-LLM.git

# Opción 2: Configurar credenciales
git config --global credential.helper store
# Luego hacer push y entrar credenciales cuando se pida
```

## 📝 Notas Importantes

- ✅ La rama `frontend-mejorado` ya está creada
- ✅ El backend NO está incluido (solo frontend y raíz)
- ✅ El Dockerfile está optimizado para producción
- ✅ El CI/CD está configurado para la rama `frontend-mejorado`
- ✅ Todos los archivos necesarios están incluidos

