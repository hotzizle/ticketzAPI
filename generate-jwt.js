const jwt = require('jsonwebtoken');

// Usar la variable de entorno PGRST_JWT_SECRET
const secret = process.env.PGRST_JWT_SECRET;

if (!secret) {
  console.error('Error: PGRST_JWT_SECRET no está definido');
  process.exit(1);
}

// Verificar que PGRST_JWT_AUD esté definido
if (!process.env.PGRST_JWT_AUD) {
  console.error('Error: PGRST_JWT_AUD no está definido');
  process.exit(1);
}

// Token para rol authenticated
const authenticatedPayload = {
  role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 año (365 días)
  aud: process.env.PGRST_JWT_AUD // Debe coincidir con el valor en el XML
};

const authenticatedToken = jwt.sign(authenticatedPayload, secret);

console.log('Token para rol authenticated (válido por 1 año):');
console.log(authenticatedToken); 
