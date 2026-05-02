export function renderProjectionRepairDiff(files: string[]) {
  return files.map((file) => `DRY-RUN projection repair candidate: ${file}`).join("\n");
}
