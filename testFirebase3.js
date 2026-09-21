async function test() {
  const res = await fetch('https://firebasestorage.googleapis.com/v0/b/eduteam-d0d9e.firebasestorage.app/o?name=test.txt', {
    method: 'POST',
    body: 'hello',
    headers: { 'Content-Type': 'text/plain' }
  });
  console.log(res.status, await res.text());
}
test();
