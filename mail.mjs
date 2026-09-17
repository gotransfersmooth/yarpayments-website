// Server-only Zoho Mail delivery. Never import this module from the public site.
export function createZohoMailer(env = process.env, request = fetch) {
  let token;
  let tokenExpires = 0;
  let pendingToken;
  const regions = {
    com: ['https://accounts.zoho.com', 'https://mail.zoho.com'],
    eu: ['https://accounts.zoho.eu', 'https://mail.zoho.eu'],
    in: ['https://accounts.zoho.in', 'https://mail.zoho.in'],
    'com.au': ['https://accounts.zoho.com.au', 'https://mail.zoho.com.au'],
    jp: ['https://accounts.zoho.jp', 'https://mail.zoho.jp'],
    ca: ['https://accounts.zohocloud.ca', 'https://mail.zohocloud.ca'],
    sa: ['https://accounts.zoho.sa', 'https://mail.zoho.sa']
  };
  const hosts = regions[env.ZOHO_REGION || 'com'];
  const configured = () => Boolean(hosts && env.ZOHO_CLIENT_ID && env.ZOHO_CLIENT_SECRET && env.ZOHO_REFRESH_TOKEN && /^\d+$/.test(env.ZOHO_ACCOUNT_ID || '') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ZOHO_FROM_ADDRESS || ''));
  async function accessToken() {
    if (token && tokenExpires > Date.now()) return token;
    if (pendingToken) return pendingToken;
    pendingToken = (async () => {
      const response = await request(`${hosts[0]}/oauth/v2/token`, {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({grant_type:'refresh_token',client_id:env.ZOHO_CLIENT_ID,client_secret:env.ZOHO_CLIENT_SECRET,refresh_token:env.ZOHO_REFRESH_TOKEN}), signal:AbortSignal.timeout(10000)});
      const data = await response.json();
      if (!response.ok || !data.access_token) throw new Error('Zoho authentication unavailable');
      token = data.access_token;
      tokenExpires = Date.now() + Math.max(0, Number(data.expires_in || 3600) - 60) * 1000;
      return token;
    })();
    try { return await pendingToken; } finally { pendingToken = undefined; }
  }
  return {
    configured,
    async send({name,email,interest,message}) {
      if (!configured()) throw new Error('Email is not configured');
      const auth = await accessToken();
      const response = await request(`${hosts[1]}/api/accounts/${env.ZOHO_ACCOUNT_ID}/messages`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Zoho-oauthtoken ${auth}`},
        body:JSON.stringify({fromAddress:env.ZOHO_FROM_ADDRESS,toAddress:'samrat@transfersmooth.com',subject:'Website enquiries',mailFormat:'plaintext',content:`New enquiry from the Yara Pay website\n\nName: ${name}\nEmail: ${email}\nInterest: ${interest}\n\n${message || 'No additional message provided.'}\n\nRespond to the visitor using the email address above.`}),
        signal:AbortSignal.timeout(15000)
      });
      const result = await response.json();
      if (!response.ok || Number(result.status?.code) !== 200) {
        if (response.status === 401) { token = undefined; tokenExpires = 0; }
        throw new Error('Zoho did not accept the enquiry');
      }
    }
  };
}
