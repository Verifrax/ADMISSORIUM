export function classifySurface(repo: string, paths: string[]) {
  const sovereign = /^(SYNTAGMARIUM|ORBISTIUM|CONSONORIUM|TACHYRIUM|ANAGNORIUM|REGRESSORIUM)$/.test(repo);
  const projection = paths.every((p) => /^(README\.md|docs\/|public\/|site\/|pages\/)/.test(p));
  return {
    repo,
    sovereign_surface: sovereign,
    surface_class: sovereign ? "sovereign_chamber" : projection ? "projection_surface" : "implementation_surface"
  };
}
