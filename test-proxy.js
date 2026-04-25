import fs from 'fs';
async function test() {
  const res = await fetch("http://0.0.0.0:3000/proxy?url=https%3A%2F%2Fwww.youtube.com");
  const text = await res.text();
  fs.writeFileSync('youtube.html', text);
  console.log("Saved to youtube.html");
}
test();
