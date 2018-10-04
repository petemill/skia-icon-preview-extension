export default function getSourceUrl(path, master = false) {
  let segments = path.split("/");
  let author = segments[1];
  let repo = segments[2];
  let branch = master ? 'master' : segments[4];
  let file = segments.slice(5).join("/");
  return `https://raw.githubusercontent.com/${author}/${repo}/${branch}/${file}`;
}
