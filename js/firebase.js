const BASE_URL =
  "https://join---kanban-board-5501a-default-rtdb.europe-west1.firebasedatabase.app/";
export { BASE_URL };

export async function putData(path = "", data = {}) {
  await fetch(BASE_URL + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getData(path = "") {
  const res = await fetch(BASE_URL + path + ".json");
  return await res.json();
}

export async function deleteData(path = "") {
  await fetch(BASE_URL + path + ".json", { method: "DELETE" });
}
