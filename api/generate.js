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
 
    const systemPrompt = `You are an expert frontend developer. Analyze the UI screenshot and generate clean, production-ready HTML and CSS code that recreates it.
 
Style instructions: ${style || 'Clean, semantic HTML with modern CSS'}
 
CRITICAL RULES:
1. Return ONLY the complete HTML file as plain text - no markdown, no backticks, no explanations
2. Include CSS in a <style> tag inside the HTML
3. Make it pixel-perfect to the screenshot
4. Use semantic HTML5 tags
5. Make it responsive
6. Use modern CSS (flexbox, grid, CSS variables)
7. Include all necessary styles for colors, spacing, typography, layout
8. If there are images in the screenshot, use placeholder divs with background colors
9. Start directly with <!DOCTYPE html> - nothing before it
 
Generate the complete, ready-to-use HTML file now:`;
 
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
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
 
    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ 
        error: "No response from AI", 
        details: data 
      });
    }
 
    let code = data.choices[0].message.content || "";
    
    // Clean up the response - remove markdown if present
    code = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Ensure it starts with DOCTYPE
    if (!code.toLowerCase().startsWith('<!doctype')) {
      code = '<!DOCTYPE html>\n' + code;
    }
 
    res.status(200).json({ code });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: String(err) });
  }
}