import fs from 'fs';
import https from 'https';

const key = fs.readFileSync('.env', 'utf8').split('\n').find(l => l.includes('FOOTBALL_DATA_KEY')).split('=')[1].trim();

https.get('https://api.football-data.org/v4/competitions/WC/matches?matchday=1', {
    headers: { 'X-Auth-Token': key }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const json = JSON.parse(body);
        let sql = '';
        json.matches.forEach(m => {
            if (m.group) {
                sql += `UPDATE partidas SET grupo = '${m.group}' WHERE api_match_id = ${m.id};\n`;
            }
        });
        fs.writeFileSync('tmp-update.sql', sql);
        console.log("SQL GENERATED");
    });
});
