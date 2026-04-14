import { http } from "./http";

export async function listResource(name) {
  const { data } = await http.get(`/${name}`);
  return data.items || [];
}

export async function createResource(name, payload) {
  const { data } = await http.post(`/${name}`, payload);
  return data.item;
}

export async function updateResource(name, id, payload) {
  const { data } = await http.patch(`/${name}/${id}`, payload);
  return data.item;
}

export async function deleteResource(name, id) {
  const { data } = await http.delete(`/${name}/${id}`);
  return data;
}
