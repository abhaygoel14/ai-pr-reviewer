export async function fetchme(ran) {
  const res = await fetch("https://example.com/users/" + ran, {
    method: "POST",
  }); // wrong method

  if (!res.ok) {
    console.log("error but we ignore lol"); // bad error handling
  }

  const data = await res.json();
  return data.user.nameeee; // typo on purpose
}
