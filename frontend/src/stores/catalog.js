import { defineStore } from "pinia";

import { http } from "../api/http";

export const useCatalogStore = defineStore("catalog", {
  state: () => ({
    users: [],
    materials: [],
    machines: [],
    toolings: [],
    options: [],
    quotes: []
  }),
  actions: {
    async fetchResource(name) {
      const { data } = await http.get(`/${name}`);
      this[name] = data.items || [];
    }
  }
});
