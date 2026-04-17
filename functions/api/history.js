export async function onRequestGet(context) {
  try {
    // Attempt to read from the KV namespace bound as 'KV_HISTORY'
    if (!context.env.KV_HISTORY) {
      throw new Error("KV_HISTORY is not bound. Please configure it in your Cloudflare dashboard.");
    }

    const value = await context.env.KV_HISTORY.get("key_history");
    const data = value ? JSON.parse(value) : [];
    
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, data: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  try {
    if (!context.env.KV_HISTORY) {
      throw new Error("KV_HISTORY is not bound. Please configure it in your Cloudflare dashboard.");
    }

    const body = await context.request.json();
    
    if (!Array.isArray(body)) {
      throw new Error("Invalid payload: expected an array of history entries");
    }
    
    // Save to Cloudflare KV Database
    await context.env.KV_HISTORY.put("key_history", JSON.stringify(body));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
