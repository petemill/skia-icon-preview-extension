export default function getSourceUrl(path, refOverride) {
  let segments = path.split("/");
  let author = segments[1];
  let repo = segments[2];
  let branch = refOverride || segments[4];
  let file = segments.slice(5).join("/");
  return `https://raw.githubusercontent.com/${author}/${repo}/${branch}/${file}`;
}
