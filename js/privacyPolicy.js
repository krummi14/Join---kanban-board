const PRIVACY_POLICY_PARTS = [
  "./privacy_policy/part1.html",
  "./privacy_policy/part2.html",
  "./privacy_policy/part3.html",
];

async function initPrivacyPolicyContent() {
  const article = document.getElementById("privacy-policy-article");
  if (!article) return;
  try {
    article.innerHTML = await loadPrivacyPolicyParts();
  } catch (error) {
    showPrivacyPolicyLoadError(article, error);
  }
}

async function loadPrivacyPolicyParts() {
  const parts = await Promise.all(PRIVACY_POLICY_PARTS.map(fetchPrivacyPolicyPart));
  return parts.join("");
}

async function fetchPrivacyPolicyPart(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.text();
}

function showPrivacyPolicyLoadError(article, error) {
  article.innerHTML = "<p>Privacy policy could not be loaded.</p>";
  console.error("Failed to load privacy policy content.", error);
}

document.addEventListener("DOMContentLoaded", initPrivacyPolicyContent);
