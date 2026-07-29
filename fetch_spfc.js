import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

async function downloadFile(url, fileName) {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(fileName);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function run() {
  try {
    await downloadFile('https://crests.football-data.org/1776.png', 'public/spfc_test.png');
    console.log("Downloaded SPFC crest to public/spfc_test.png");
  } catch (err) {
    console.error(err);
  }
}

run();
