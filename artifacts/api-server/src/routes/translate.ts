import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: string;
  source: string;
  publishedAt: string;
  url?: string;
}

const LANG_CONFIG: Record<string, { name: string; instruction: string }> = {
  ko: {
    name: "Korean",
    instruction: "Translate to natural, concise Korean. Keep financial terms, company names, and tickers in their original English form.",
  },
  zh: {
    name: "Simplified Chinese",
    instruction: "Translate to natural, concise Simplified Chinese (简体中文). Keep financial terms, company names, and tickers in their original English form.",
  },
};

router.post("/news", async (req, res) => {
  const { news, lang } = req.body as { news: NewsItem[]; lang: string };

  if (!Array.isArray(news) || news.length === 0) {
    res.json({ news: [] });
    return;
  }

  const config = LANG_CONFIG[lang];
  if (!config) {
    // Unsupported language — return original
    res.json({ news });
    return;
  }

  try {
    const toTranslate = news.map((item, i) => ({
      i,
      headline: item.headline,
      summary: item.summary,
    }));

    const prompt = `You are a professional financial news translator. Translate the following stock market news items to ${config.name}.
${config.instruction}
Return ONLY a valid JSON array with the same structure: [{"i": number, "headline": "...", "summary": "..."}]

Items to translate:
${JSON.stringify(toTranslate, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const translated: { i: number; headline: string; summary: string }[] = JSON.parse(jsonMatch[0]);
    const translatedMap = new Map(translated.map((t) => [t.i, t]));

    const result = news.map((item, i) => {
      const t = translatedMap.get(i);
      return t ? { ...item, headline: t.headline, summary: t.summary } : item;
    });

    res.json({ news: result });
  } catch (err) {
    console.error("[translate] Error:", err);
    res.json({ news });
  }
});

export default router;
