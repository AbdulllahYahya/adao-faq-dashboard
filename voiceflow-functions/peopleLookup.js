/**
 * VoiceFlow Custom Function: peopleLookup
 *
 * INPUT VARIABLES (set in VF function config):
 *   - last_utterance (string): The user's question (e.g. "Who is Linda Reinstein?")
 *   - api_base_url (string): Your deployed API base URL
 *
 * OUTPUT VARIABLES (map in VF function config):
 *   - person_name (string): The person's name
 *   - person_bio (string): AI-generated bio
 *   - person_title (string): Their title/role
 *   - person_link (string): Link to their page
 *   - person_found (string): "true" or "false"
 *
 * EXIT PATHS:
 *   - found: Person found — output directly
 *   - not_found: Person not in database
 *   - error: Something went wrong
 */
export default async function main(args) {
  var last_utterance = args.inputVars.last_utterance;
  var api_base_url = args.inputVars.api_base_url;

  if (!last_utterance || last_utterance === "0" || last_utterance === "empty") {
    return {
      outputVars: { person_name: "empty", person_bio: "empty", person_title: "empty", person_link: "empty", person_found: "false" },
      next: { path: 'not_found' },
      trace: [{ type: "debug", payload: { message: "No utterance for people lookup" } }]
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

  // Extract person name from "Who is [name]?" pattern
  var nameMatch = last_utterance.match(/who\s+is\s+(.+?)[\?\.\!]?$/i);
  var searchName = nameMatch ? nameMatch[1].trim() : last_utterance.trim();

  try {
    var response = await fetch(baseUrl + '/api/chatbot/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: searchName })
    });

    var data = response.json;

    if (!data || typeof data !== 'object') {
      return {
        outputVars: { person_name: "empty", person_bio: "empty", person_title: "empty", person_link: "empty", person_found: "false" },
        next: { path: 'error' },
        trace: [{ type: "debug", payload: { message: "Invalid response from People API" } }]
      };
    }

    if (data.error) {
      return {
        outputVars: { person_name: "empty", person_bio: "empty", person_title: "empty", person_link: "empty", person_found: "false" },
        next: { path: 'error' },
        trace: [{ type: "debug", payload: { message: "People API error: " + data.error } }]
      };
    }

    if (data.found !== true) {
      return {
        outputVars: { person_name: searchName, person_bio: "empty", person_title: "empty", person_link: "empty", person_found: "false" },
        next: { path: 'not_found' },
        trace: [{ type: "debug", payload: { message: "Person not found: " + searchName } }]
      };
    }

    // Single person found
    if (!data.multiple) {
      var p = data.person;
      return {
        outputVars: {
          person_name: p.name || "empty",
          person_bio: p.ai_bio || p.information || "empty",
          person_title: p.title || "empty",
          person_link: p.link || "empty",
          person_found: "true"
        },
        next: { path: 'found' },
        trace: [
          {
            type: "debug",
            payload: { message: "Person found: " + p.name + " | " + (p.title || "No title") }
          }
        ]
      };
    }

    // Multiple people matched — return first one
    var firstPerson = data.people[0];
    return {
      outputVars: {
        person_name: firstPerson.name || "empty",
        person_bio: firstPerson.ai_bio || "empty",
        person_title: firstPerson.title || "empty",
        person_link: firstPerson.link || "empty",
        person_found: "true"
      },
      next: { path: 'found' },
      trace: [
        {
          type: "debug",
          payload: {
            message: "Multiple people matched (" + data.people.length + "), returning first: " + firstPerson.name
          }
        }
      ]
    };

  } catch (error) {
    return {
      outputVars: { person_name: "empty", person_bio: "empty", person_title: "empty", person_link: "empty", person_found: "false" },
      next: { path: 'error' },
      trace: [{ type: "debug", payload: { message: "People fetch error: " + error.message } }]
    };
  }
}
