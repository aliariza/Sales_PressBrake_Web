export function createPlaceholderController(resourceName) {
  return {
    list: async (_req, res) => res.json({ resource: resourceName, items: [] }),
    getById: async (req, res) => res.json({ resource: resourceName, id: req.params.id }),
    create: async (req, res) =>
      res.status(201).json({ resource: resourceName, message: "Not implemented yet", body: req.body }),
    update: async (req, res) =>
      res.json({ resource: resourceName, id: req.params.id, message: "Not implemented yet", body: req.body }),
    remove: async (req, res) =>
      res.json({ resource: resourceName, id: req.params.id, message: "Not implemented yet" })
  };
}
