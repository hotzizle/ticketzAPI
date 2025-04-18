#!/bin/bash

# Reemplaza estos valores con tus tokens JWT reales
READ_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJleHAiOjE4OTM0NTYwMDB9.EMpS8dbcYVotE7eXknzUuJ50J4SxG8T8XcXCiyHrn7o"
WRITE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXBpX3dyaXRlciIsImV4cCI6MTg5MzQ1NjAwMH0.HoLpORoaUagfbEDd3_8C1GOhCMKwDxSnYCB1AAlrVIE"

# Configuración básica
API_URL="http://10.0.0.250:8001"

echo "=== Ejemplos de consultas de lectura (GET) ==="

# Consulta de lectura sin autenticación (si está permitido)
echo -e "\n1. Obtener tickets sin autenticación:"
curl -s $API_URL/Tickets?limit=2 | json_pp

# Consulta de lectura con token de autenticación
echo -e "\n2. Obtener usuarios con autenticación:"
curl -s -H "Authorization: Bearer $READ_TOKEN" $API_URL/Users?limit=2 | json_pp

echo -e "\n\n=== Ejemplos de operaciones de escritura ==="

# Crear un nuevo ticket (POST)
echo -e "\n3. Crear un nuevo ticket:"
curl -s -X POST $API_URL/Tickets \
  -H "Authorization: Bearer $WRITE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"open", "contactId":1, "queueId":1, "userId":1, "title":"Ticket de prueba"}' | json_pp

# Actualizar un ticket (PATCH) - Reemplaza 1 con un ID válido
echo -e "\n4. Actualizar un ticket existente (ID=1):"
curl -s -X PATCH $API_URL/Tickets?id=eq.1 \
  -H "Authorization: Bearer $WRITE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"closed"}' | json_pp

# Eliminar un ticket (DELETE) - Reemplaza 999 con un ID que puedas eliminar
echo -e "\n5. Eliminar un ticket (ID=999):"
curl -s -X DELETE $API_URL/Tickets?id=eq.999 \
  -H "Authorization: Bearer $WRITE_TOKEN" -v

echo -e "\n\nPruebas de API completadas." 