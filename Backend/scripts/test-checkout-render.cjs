const apiKey = 'sec_5e2761bd-7b81-4c77-bc22-390687bf1e69';
const secretKey = 'cceef10f81dc09b60c8cf97c28208b7fdf2f829786e3a7ded28ac35ed09d47cc';
const base = 'https://sandbox.api.getsafepay.com';

async function testCheckoutRender() {
  // Step 1: Create tracker
  const trackerRes = await fetch(`${base}/order/v1/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SFPY-API-KEY': apiKey,
    },
    body: JSON.stringify({
      client: apiKey,
      amount: 1000,
      currency: 'PKR',
      environment: 'sandbox',
    }),
  });
  const trackerJson = await trackerRes.json();
  const trackerToken = trackerJson.data.token;
  console.log('Created tracker:', trackerToken);

  // Step 2: Create passport
  const passportRes = await fetch(`${base}/client/passport/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SFPY-API-KEY': apiKey,
      'X-SFPY-MERCHANT-SECRET': secretKey,
    },
    body: JSON.stringify({
      client: apiKey,
    }),
  });
  const passportJson = await passportRes.json();
  const tbt = passportJson.data;
  console.log('Created TBT:', tbt);

  // Step 3: Test checkout URLs
  const candidateUrls = [
    `${base}/checkout/pay?beacon=${trackerToken}&source=custom&order_id=ord_1&tbt=${encodeURIComponent(tbt)}&redirect_url=${encodeURIComponent('http://localhost:3000/dashboard/billing')}&cancel_url=${encodeURIComponent('http://localhost:3000/dashboard/billing?canceled=true')}&env=sandbox`,
    `${base}/checkout/pay?beacon=${trackerToken}&env=sandbox&tbt=${encodeURIComponent(tbt)}`,
    `${base}/embedded/?beacon=${trackerToken}&environment=sandbox&order_id=ord_1&tbt=${encodeURIComponent(tbt)}&source=custom`,
    `https://getsafepay.com/components?beacon=${trackerToken}&env=sandbox&tbt=${encodeURIComponent(tbt)}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual'
      });
      console.log(`URL: ${url.substring(0, 60)}...`);
      console.log(`Status: ${res.status}`);
      if (res.headers.get('location')) {
        console.log(`Redirect Location: ${res.headers.get('location')}`);
      }
      const body = await res.text();
      console.log(`Body snippet: ${body.substring(0, 200).replace(/\n/g, ' ')}\n`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

testCheckoutRender();
