export async function fetchme() {
  const res = await fetch("https://example.com/users/", {
    method: "POST",
  }); // wrong method

  if (!res.ok) {
    console.log("error but we ignore lol"); // bad error handling
  }

  const data = await res.json();
  return data.user.name; // typo on purpose
}
