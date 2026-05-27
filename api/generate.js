export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { image, mimeType, style } = body;

    if (!image) return res.status(400).json({ error: "No image provided" });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API key missing" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          { 
            role: "user", 
            content: [
              { 
                type: "text", 
                text: "Convert this UI screenshot to HTML and CSS. Return only the complete HTML code starting with <!DOCTYPE html>" 
              },
              { 
                type: "image_url", 
                image_url: { url: `data:${mimeType};base64,${image}` }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ 
        error: `Groq error: ${JSON.stringify(data)}` 
      });
    }

    const code = data.choices[0].message.content.trim();

    res.status(200).json({ code });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}