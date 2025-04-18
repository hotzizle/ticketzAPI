const jwt = require('jsonwebtoken');

// Reemplaza esto con la misma clave secreta que usas en PGRST_JWT_SECRET
const secret = '4bad933cb91663ef24e2a8422342a47dc665531906bfaa35b44a0bd92260935059217098331e32b1489ae0b013360e2ae0100346c0aa67946c3b8057ad4d3bc7';

// Token para rol authenticated
const authenticatedPayload = {
  role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 año (365 días)
  aud: 'wsapi.somoslacomunidad.com' // Debe coincidir con PGRST_JWT_AUD
};

const authenticatedToken = jwt.sign(authenticatedPayload, secret);

console.log('Token para rol authenticated (válido por 1 año):');
console.log(authenticatedToken); 