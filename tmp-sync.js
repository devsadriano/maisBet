void (async () => {
  try {
    const res = await fetch('http://localhost:3000/api/sync/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchday: 1,
        api_competition_code: 'WC'
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
})();
