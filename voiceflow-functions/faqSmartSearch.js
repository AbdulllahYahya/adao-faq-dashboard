/**
 * VoiceFlow Custom Function: faqSmartSearch
 *
 * INPUT VARIABLES (set in VF function config):
 *   - last_utterance (string): The user's question
 *   - api_base_url (string): Your deployed API base URL (e.g. https://your-app.vercel.app)
 *
 * OUTPUT VARIABLES (map in VF function config):
 *   - faq_answer (string): The matched FAQ answer (if found)
 *   - faq_link (string): The source link (if found)
 *   - faq_category (string): The detected category
 *   - category_faqs_json (string): JSON string of all FAQs from the category (if not found)
 *   - match_status (string): "found" or "not_found" or "people"
 *
 * EXIT PATHS:
 *   - found: Direct FAQ match — output the answer directly
 *   - not_found: No match — feed category_faqs_json to AI agent/playbook
 *   - people: "Who is" question — route to people lookup subflow
 *   - error: Something went wrong
 */
export default async function main(args) {
  var last_utterance = args.inputVars.last_utterance;
  var api_base_url = args.inputVars.api_base_url;

  // Validate inputs
  if (!last_utterance || last_utterance === "0" || last_utterance === "empty") {
    return {
      next: { path: 'error' },
      trace: [{ type: "debug", payload: { message: "Missing last_utterance input" } }]
    };
  }

  if (!api_base_url || api_base_url === "0" || api_base_url === "empty") {
    return {
      next: { path: 'error' },
      trace: [{ type: "debug", payload: { message: "Missing api_base_url input" } }]
    };
  }

  // Remove trailing slash
  var baseUrl = api_base_url;
  if (baseUrl.charAt(baseUrl.length - 1) === '/') {
    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
  }

  try {
    var response = await fetch(baseUrl + '/api/chatbot/faq-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: last_utterance })
    });

    var data = response.json;

    if (!data || typeof data !== 'object') {
      return {
        next: { path: 'error' },
        trace: [{ type: "debug", payload: { message: "Invalid response from FAQ match API" } }]
      };
    }

    // Check for API error
    if (data.error) {
      return {
        next: { path: 'error' },
        trace: [{ type: "debug", payload: { message: "API error: " + data.error } }]
      };
    }

    // ===== MATCH FOUND =====
    if (data.matched === true && data.faq) {
      var answer = data.faq.answer || "empty";
      var link = data.faq.link || "empty";
      var category = data.faq.category || "empty";

      return {
        outputVars: {
          faq_answer: answer,
          faq_link: link,
          faq_category: category,
          category_faqs_json: "empty",
          match_status: "found"
        },
        next: { path: 'found' },
        trace: [
          {
            type: "debug",
            payload: {
              message: "FAQ MATCH FOUND | Category: " + category + " | Q: " + data.faq.question
            }
          }
        ]
      };
    }

    // ===== PEOPLE CATEGORY =====
    if (data.category === 'PEOPLE') {
      return {
        outputVars: {
          faq_answer: "empty",
          faq_link: "empty",
          faq_category: "PEOPLE",
          category_faqs_json: "empty",
          match_status: "people"
        },
        next: { path: 'people' },
        trace: [
          {
            type: "debug",
            payload: { message: "Detected PEOPLE question — routing to people lookup" }
          }
        ]
      };
    }

    // ===== NO MATCH — return category FAQs for AI =====
    var catName = data.category || "FUNDAMENTALS";
    var bucketName = data.bucket_name || catName;
    var faqs = data.faqs || [];

    return {
      outputVars: {
        faq_answer: "empty",
        faq_link: "empty",
        faq_category: catName,
        category_faqs_json: JSON.stringify(faqs),
        match_status: "not_found"
      },
      next: { path: 'not_found' },
      trace: [
        {
          type: "debug",
          payload: {
            message: "NO MATCH | Category: " + catName + " (" + bucketName + ") | " + faqs.length + " FAQs loaded for AI"
          }
        }
      ]
    };

  } catch (error) {
    return {
      next: { path: 'error' },
      trace: [{ type: "debug", payload: { message: "Fetch error: " + error.message } }]
    };
  }
}
