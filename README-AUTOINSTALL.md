# Instalación Automática de Ticketz

Este método instala Ticketz automáticamente solicitando solo la información necesaria.

## Requisitos Mínimos
- Ubuntu 20.04 o superior
- 4GB de RAM
- Dominio configurado en Cloudflare
- Token de túnel de Cloudflare (lo obtienes en Zero Trust > Tunnels)
- Acceso root o sudo

## Instalación

1. Descarga el script de instalación:
```bash
wget https://raw.githubusercontent.com/ticketz-oss/ticketz/main/install.sh
```

2. Dale permisos de ejecución:
```bash
chmod +x install.sh
```

3. Ejecuta el instalador:
```bash
sudo ./install.sh
```

El script te pedirá:
- Tu dominio principal (ejemplo: tudominio.com)
- El subdominio para Ticketz (ejemplo: ticketz)
- El subdominio para la API (ejemplo: api)
- El token del túnel de Cloudflare
- Email del administrador

## Proceso de Instalación

El instalador realizará automáticamente:

1. Verificación de requisitos mínimos
2. Instalación de dependencias (Docker y Git)
3. Clonación del repositorio
4. Configuración de todos los archivos necesarios
5. Generación de JWT Secret aleatorio
6. Inicio de servicios
7. Creación de script de mantenimiento

## Archivos Generados

- `~/.ticketz/config.txt`: Guarda la configuración de la instalación
- `maintenance.sh`: Script para mantenimiento del sistema
- Archivos .env con la configuración de cada servicio

## Comandos de Mantenimiento

El script `maintenance.sh` proporciona varios comandos útiles:

```bash
./maintenance.sh status   # Ver estado de los servicios
./maintenance.sh logs    # Ver logs en tiempo real
./maintenance.sh restart # Reiniciar todos los servicios
./maintenance.sh update  # Actualizar a la última versión
./maintenance.sh backup  # Crear backup de la base de datos
```

## Acceso al Sistema

Después de la instalación, podrás acceder a:
- Frontend: https://[subdominio].[tudominio.com]
- API: https://[api-subdominio].[tudominio.com]

Las credenciales iniciales son:
- Email: [el email que proporcionaste]
- Contraseña: 123456

## Importante

1. Cambia la contraseña por defecto inmediatamente después de iniciar sesión
2. Los archivos de configuración contienen información sensible, protégelos adecuadamente
3. Guarda una copia segura del JWT Secret generado
4. Realiza backups periódicos usando el comando `./maintenance.sh backup`

## Solución de Problemas

Si encuentras algún error durante la instalación:

1. Verifica los logs:
```bash
./maintenance.sh logs
```

2. Asegúrate de que todos los servicios estén funcionando:
```bash
./maintenance.sh status
```

3. Si es necesario, reinicia los servicios:
```bash
./maintenance.sh restart
```

4. Verifica que los subdominios estén correctamente configurados en Cloudflare

## Soporte

Si necesitas ayuda adicional:
1. Revisa los logs completos en tiempo real
2. Verifica la configuración en ~/.ticketz/config.txt
3. Asegúrate de que el token de Cloudflare sea válido
4. Comprueba que los puertos necesarios no estén bloqueados 