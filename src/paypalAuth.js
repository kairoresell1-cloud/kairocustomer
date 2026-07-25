const fetch = require('node-fetch');

function getBaseUrl() {
  return process.env.PAYPAL_ENV === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

// Ottiene un token OAuth2 valido da PayPal usando Client ID + Secret
async function getPayPalToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Errore autenticazione PayPal: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

module.exports = { getPayPalToken, getBaseUrl };
