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
        model: "gpt-4-vision",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: "Generate HTML/CSS for this UI" },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${image}` } }
            ]
          }
        ],
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: JSON.stringify(data) });
    }

    const code = data.choices[0].message.content;
    res.status(200).json({ code });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}