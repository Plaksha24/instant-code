export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { image, mimeType } = body;

    if (!image) return res.status(400).json({ error: "No image" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No API key" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: "Convert this UI screenshot to clean HTML and CSS. Return only complete HTML code starting with <!DOCTYPE html>" },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${image}` } }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: JSON.stringify(data) });
    }

    let code = data.choices[0].message.content.trim();
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    res.status(200).json({ code });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}