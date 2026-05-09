async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/validate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" })
    });
    console.log(res.status);
    console.log(await res.json());
  } catch (e) {
    console.error(e);
  }
}
test();
