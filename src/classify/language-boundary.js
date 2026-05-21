const DANGER_PHRASES = [
  "decides truth",
  "accepted truth",
  "terminal recognition",
  "assigns recourse",
  "issues authority",
  "source of truth"
];

function normalize(value) {
  return JSON.stringify(value).toLowerCase();
}

function maskSafeBoundaryDenials(text) {
  return text
    .replace(/\bnot\s+(?:the\s+)?accepted truth\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bnot\s+(?:a\s+)?source of truth\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+decide truth\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+accept state\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+issue authority\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+execute\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+verify(?:\s+as\s+final\s+source)?\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+recognize terminal truth\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bdoes not\s+assign recourse\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bwithout becoming\s+(?:the\s+)?source of truth\b/g, " SAFE_BOUNDARY_DENIAL ")
    .replace(/\bwithout becoming\s+(?:the\s+)?truth source\b/g, " SAFE_BOUNDARY_DENIAL ");
}

export function dangerText(input) {
  return maskSafeBoundaryDenials(normalize(input));
}

export function hasSovereignDanger(input) {
  const text = dangerText(input);
  return DANGER_PHRASES.some(phrase => text.includes(phrase));
}

export function hasAnyDangerPhrase(input, phrases) {
  const text = dangerText(input);
  return phrases.some(phrase => text.includes(phrase));
}
