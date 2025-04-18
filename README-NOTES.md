# Notas Importantes de Ticketz

## Pre-instalación 🔍

### Verificaciones Críticas
- Asegúrate de tener acceso root o sudo
- Verifica que tienes al menos 4GB de RAM libre
- Comprueba que los puertos 80 y 443 no estén en uso
- Asegúrate de que Docker no esté instalado previamente (o está actualizado)

### Preparación de Cloudflare
1. Configura tu dominio en Cloudflare
2. Crea un túnel en Zero Trust > Tunnels
3. Guarda el token del túnel en un lugar seguro
4. Verifica que los DNS de tu dominio apunten a Cloudflare

## Durante la Instalación 🚀

### Puntos de Control
1. Al ejecutar `install.sh`:
   - Si falla la instalación de Docker, ejecuta `apt-get update` manualmente
   - Si Git falla, verifica la conexión a internet
   - Si el clonado falla, verifica que GitHub esté accesible

2. Configuración de dominios:
   ```
   dominio.com         → Dominio principal
   ticketz.dominio.com → Frontend
   api.dominio.com     → API
   ```

### Archivos Críticos
```
.env-postgrest      → Contiene el JWT_SECRET (¡Hacer backup!)
.env-cloudflared    → Contiene el token del túnel
.env-frontend       → Configuración del frontend
.env-backend        → Configuración del backend
~/.ticketz/config.txt → Resumen de la configuración
```

## Post-instalación 🛠️

### Verificaciones Inmediatas
1. Comprobar servicios:
   ```bash
   ./maintenance.sh status
   ```
   Todos los servicios deben mostrar "Up"

2. Verificar logs:
   ```bash
   ./maintenance.sh logs | grep -i error
   ```
   No deberían aparecer errores críticos

3. Probar acceso:
   - Frontend: https://ticketz.tudominio.com
   - API: https://api.tudominio.com

### Seguridad
1. Cambiar inmediatamente:
   - Contraseña del administrador (123456)
   - Permisos de archivos .env (chmod 600)
   - Backup del JWT_SECRET

2. Verificar:
   - Que la API requiere autenticación
   - Que el frontend se conecta correctamente
   - Que Cloudflare muestra el túnel activo

## Errores Comunes y Soluciones 🔧

### 1. Error de Conexión a la API
```
Error: Failed to fetch API
```
Soluciones:
- Verificar que el subdominio API está bien configurado
- Comprobar el token de Cloudflare
- Revisar logs de postgrest

### 2. Error de Autenticación
```
JWSError JWSInvalidSignature
```
Soluciones:
- Verificar JWT_SECRET en .env-postgrest
- Reiniciar servicio postgrest
- Limpiar caché del navegador

### 3. Error de Docker
```
Error: Cannot connect to Docker daemon
```
Soluciones:
- Reiniciar Docker: `systemctl restart docker`
- Verificar permisos: `usermod -aG docker $USER`
- Reiniciar el sistema

### 4. Error de Base de Datos
```
Error: Connection refused postgres:5432
```
Soluciones:
- Esperar 30 segundos más tras el inicio
- Verificar logs: `./maintenance.sh logs postgres`
- Reiniciar postgres: `./maintenance.sh restart postgres`

## Mantenimiento Regular 🔄

### Diario
1. Verificar estado de servicios
2. Revisar logs por errores
3. Monitorear uso de recursos

### Semanal
1. Realizar backup de la base de datos:
   ```bash
   ./maintenance.sh backup
   ```
2. Verificar espacio en disco
3. Revisar logs antiguos

### Mensual
1. Actualizar sistema:
   ```bash
   ./maintenance.sh update
   ```
2. Verificar versiones de dependencias
3. Rotar logs antiguos
4. Comprobar certificados SSL

## Optimización 🚀

### Rendimiento
1. Ajustar pool de conexiones en .env-postgrest:
   ```
   PGRST_DB_POOL=10
   ```
2. Configurar caché en Cloudflare
3. Optimizar consultas frecuentes

### Monitoreo
1. Revisar métricas de Cloudflare
2. Monitorear tiempos de respuesta
3. Verificar uso de recursos:
   ```bash
   docker stats
   ```

## Backup y Recuperación 💾

### Backup Manual
```bash
./maintenance.sh backup
```
Guarda en:
- Base de datos: backup_YYYYMMDD.sql
- Configuración: ~/.ticketz/
- Archivos .env

### Recuperación
1. Restaurar base de datos:
   ```bash
   docker-compose exec -T postgres psql -U ticketz ticketz < backup.sql
   ```
2. Verificar configuración
3. Reiniciar servicios 