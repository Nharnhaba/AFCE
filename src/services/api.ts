const BASE_URL = 'http://afce-media-api.test'; // swap for live URL once hosted

export async function getTrendingVideos() {
  const res = await fetch(`${BASE_URL}/api/videos?sort=trending`);
  return res.json();
}

export async function getTrendingTracks() {
  const res = await fetch(`${BASE_URL}/api/tracks?sort=trending`);
  return res.json();
}

export async function getTrendingArticles() {
  const res = await fetch(`${BASE_URL}/api/articles?sort=trending`);
  return res.json();
}
