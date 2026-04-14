import {
  createQuote,
  deleteQuote,
  getQuoteById,
  listQuotes
} from "../services/quoteService.js";
import { generateQuotePdf } from "../services/quotePdfService.js";

export async function listQuotesController(_req, res) {
  const items = await listQuotes();
  res.json({ items });
}

export async function getQuoteByIdController(req, res) {
  const item = await getQuoteById(req.params.id);
  res.json({ item });
}

export async function createQuoteController(req, res) {
  const item = await createQuote(req.body);
  res.status(201).json({ item });
}

export async function deleteQuoteController(req, res) {
  const result = await deleteQuote(req.params.id);
  res.json(result);
}

export async function downloadQuotePdfController(req, res) {
  const { quote, buffer } = await generateQuotePdf(req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${quote.quoteCode}.pdf"`);
  res.send(buffer);
}
