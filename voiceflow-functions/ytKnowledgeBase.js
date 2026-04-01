/**
 * VoiceFlow Custom Function: ytKnowledgeBase
 *
 * INPUT VARIABLES (set in VF function config):
 *   - last_utterance (string): The user's question
 *   - api_base_url (string): Your deployed API base URL
 *
 * OUTPUT VARIABLES (map in VF function config):
 *   - yt_response (string): JSON string with matched video(s) info
 *   - yt_found (string): "true" or "false"
 *
 * EXIT PATHS:
 *   - found: Relevant video(s) found
 *   - not_found: No relevant videos
 *   - error: Something went wrong
 */
export default async function main(args) {
  var last_utterance = args.inputVars.last_utterance;
  var api_base_url = args.inputVars.api_base_url;

  if (!last_utterance || last_utterance === "0" || last_utterance === "empty") {
    return {
      outputVars: { yt_response: "empty", yt_found: "false" },
      next: { path: 'not_found' },
      trace: [{ type: "debug", payload: { message: "No utterance provided for YT search" } }]
    };
  }

  if (!api_base_url || api_base_url === "0" || api_base_url === "empty") {
    return {
      next: { path: 'error' },
      trace: [{ type: "debug", payload: { message: "Missing api_base_url input" } }]
    };
  }

  var baseUrl = api_base_url;
  if (baseUrl.charAt(baseUrl.length - 1) === '/') {
    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  }

  try {
    var response = await fetch(baseUrl + '/api/chatbot/yt-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: last_utterance })
    });

    var data = response.json;

    if (!data || typeof data !== 'object') {
      return {
        outputVars: { yt_response: "empty", yt_found: "false" },
        next: { path: 'error' },
        trace: [{ type: "debug", payload: { message: "Invalid response from YT API" } }]
      };
    }

    if (data.error) {
      return {
        outputVars: { yt_response: "empty", yt_found: "false" },
        next: { path: 'error' },
        trace: [{ type: "debug", payload: { message: "YT API error: " + data.error } }]
      };
    }

    var videos = data.videos || [];

    if (videos.length === 0) {
      return {
        outputVars: { yt_response: "empty", yt_found: "false" },
        next: { path: 'not_found' },
        trace: [{ type: "debug", payload: { message: "No relevant YT videos found" } }]
      };
    }

    // Format for the AI agent prompt
    var formatted = [];
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      formatted.push({
        title: v.title || "Untitled",
        link: v.link || "",
        summary: v.summary || "",
        faqs: v.faqs || "",
        year: v.year || ""
      });
    }

    return {
      outputVars: {
        yt_response: JSON.stringify(formatted),
        yt_found: "true"
      },
      next: { path: 'found' },
      trace: [
        {
          type: "debug",
          payload: {
            message: "Found " + videos.length + " relevant YT video(s): " + videos[0].title
          }
        }
      ]
    };

  } catch (error) {
    return {
      outputVars: { yt_response: "empty", yt_found: "false" },
      next: { path: 'error' },
      trace: [{ type: "debug", payload: { message: "YT fetch error: " + error.message } }]
    };
  }
}
