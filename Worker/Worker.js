export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-cache"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      try {
        const update = await request.json();
        const post = update.channel_post || update.message;

        if (post) {
          let text = "";

          if (post.text) {
            text = post.text;
          } else if (post.caption) {
            text = post.caption;
          } else if (post.video || post.video_note) {
            text = "Video";
          } else if (post.photo) {
            text = "Image";
          } else if (post.audio || post.voice) {
            text = "Audio";
          } else if (post.document) {
            text = post.document.file_name || "File";
          } else {
            text = "New post";
          }

          const formattedFeed = text.replace(/\s+/g, " ").trim().slice(0, 50);

          await env.TG_KV.put("LATEST_FEED", formattedFeed);
        }

        return new Response("OK", { status: 200 });
      } catch (err) {
        return new Response("Error", { status: 500 });
      }
    }

    if (request.method === "GET") {
      try {
        const feed = await env.TG_KV.get("LATEST_FEED") || "Fight or Flight updates";
        const members = await env.TG_KV.get("MEMBERS_COUNT") || "1.2K";

        return new Response(JSON.stringify({
          members: members,
          feed: feed
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({
          members: "1.2K",
          feed: "Fight or Flight updates"
        }), { headers: corsHeaders });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};