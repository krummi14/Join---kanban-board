const PRIVACY_POLICY_PARTS = [
  "./privacy_policy/part1.html",
  "./privacy_policy/part2.html",
  "./privacy_policy/part3.html",
];

/** Initializes the privacy policy article content. */
async function initPrivacyPolicyContent() {
  const article = document.getElementById("privacy-policy-article");
  if (!article) return;
  try {
    article.innerHTML = await loadPrivacyPolicyParts();
  } catch (error) {
    showPrivacyPolicyLoadError(article, error);
  }
}

/** Loads and concatenates all privacy policy content parts. */
async function loadPrivacyPolicyParts() {
  const parts = await Promise.all(PRIVACY_POLICY_PARTS.map(fetchPrivacyPolicyPart));
  return parts.join("");
}

/** Fetches a single privacy policy HTML fragment. */
async function fetchPrivacyPolicyPart(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.text();
}

/** Shows a fallback message when the privacy policy cannot be loaded. */
function showPrivacyPolicyLoadError(article, error) {
  article.innerHTML = "<p>Privacy policy could not be loaded.</p>";
  console.error("Failed to load privacy policy content.", error);
}

document.addEventListener("DOMContentLoaded", initPrivacyPolicyContent);
