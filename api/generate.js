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
      return res.status(500).json({ error: "GROQ_API_KEY not set in environment" });
    }

    const systemPrompt = `You are an expert frontend developer. Analyze the UI screenshot and generate clean, production-ready HTML and CSS code.

Style: ${style || 'Clean, semantic HTML with modern CSS'}

Return ONLY complete HTML with embedded CSS. Start with <!DOCTYPE html> - nothing else before it.`;

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
              { type: "text", text: systemPrompt },
              { 
                type: "image_url", 
                image_url: {
                  url: `data:${mimeType};base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ 
        error: `Groq API error: ${data.error?.message || 'Unknown error'}` 
      });
    }

    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: "No response from Groq" });
    }

    let code = data.choices[0].message.content.trim();
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    if (!code.toLowerCase().startsWith('<!doctype')) {
      code = '<!DOCTYPE html>\n' + code;
    }

    res.status(200).json({ code });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}