const PRIVACY_POLICY_PARTS = [
  "./privacy_policy/part1.html",
  "./privacy_policy/part2.html",
  "./privacy_policy/part3.html",
];

/**
 * Initializes the privacy policy article content.
 * 
 * Loads the segmented privacy policy HTML fragments and injects them
 * into the article container, or shows a fallback on failure.
 */
async function initPrivacyPolicyContent() {
  const article = document.getElementById("privacy-policy-article");
  if (!article) return;
  try {
    article.innerHTML = await loadPrivacyPolicyParts();
  } catch (error) {
    showPrivacyPolicyLoadError(article, error);
  }
}

/**
 * Loads and concatenates all privacy policy content parts.
 * 
 * Fetches every configured fragment in parallel and combines
 * them into one HTML string for rendering.
 * 
 * @returns {Promise<string>} The combined privacy policy markup.
 */
async function loadPrivacyPolicyParts() {
  const parts = await Promise.all(PRIVACY_POLICY_PARTS.map(fetchPrivacyPolicyPart));
  return parts.join("");
}

/**
 * Fetches a single privacy policy HTML fragment.
 * 
 * Loads the requested partial HTML file and throws an error
 * when the response is not successful.
 * 
 * @param {string} path - Relative path to the HTML fragment.
 * @returns {Promise<string>} The loaded HTML content.
 */
async function fetchPrivacyPolicyPart(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.text();
}

/**
 * Shows a fallback message when the privacy policy cannot be loaded.
 * 
 * Replaces the target article content with a fallback message
 * and logs the original loading error for debugging.
 * 
 * @param {HTMLElement} article - Article element for the policy content.
 * @param {unknown} error - Original loading error.
 */
function showPrivacyPolicyLoadError(article, error) {
  article.innerHTML = "<p>Privacy policy could not be loaded.</p>";
  console.error("Failed to load privacy policy content.", error);
}

document.addEventListener("DOMContentLoaded", initPrivacyPolicyContent);
