const apiKey = 'sec_5e2761bd-7b81-4c77-bc22-390687bf1e69';
const base = 'https://sandbox.api.getsafepay.com';

async function testUnauthenticatedTracker() {
  // 1. Create tracker
  const res = await fetch(`${base}/order/v1/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-SFPY-API-KEY': apiKey },
    body: JSON.stringify({ client: apiKey, amount: 1000, currency: 'PKR', environment: 'sandbox' }),
  });
  const data = await res.json();
  const tracker = data.data.token;
  console.log('Created tracker:', tracker);

  // 2. Fetch without any headers (like the public browser checkout page does)
  const getRes = await fetch(`${base}/order/v1/${tracker}`, {
    headers: { 'Accept': 'application/json' }
  });
  console.log('Unauth GET /order/v1/:token status:', getRes.status);
  console.log('Body:', await getRes.text());
}

testUnauthenticatedTracker();
