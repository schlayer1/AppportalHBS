interface VideoResult {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = (req.query?.q as string) || '';
  if (!query.trim()) {
    return res.status(200).json({ results: [] });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      return res.status(200).json({ results: [] });
    }

    const html = await response.text();
    const videos: VideoResult[] = [];

    // Approach 1: Parse ytInitialData JSON
    const jsonMatch =
      html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
      html.match(/window\["ytInitialData"\] = ({.*?});<\/script>/s);

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents || [];

        for (const item of contents) {
          const v = item.videoRenderer;
          if (v && v.videoId) {
            videos.push({
              id: v.videoId,
              title: v.title?.runs?.[0]?.text || 'Video',
              channel: v.ownerText?.runs?.[0]?.text || '',
              duration: v.lengthText?.simpleText || '',
              thumbnail:
                v.thumbnail?.thumbnails?.[0]?.url ||
                `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`
            });
          }
        }
      } catch (err) {
        console.error('Error parsing ytInitialData JSON:', err);
      }
    }

    // Approach 2: Fallback regex if ytInitialData wasn't found or returned empty
    if (videos.length === 0) {
      const idMatches = html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g);
      const seenIds = new Set<string>();
      for (const match of idMatches) {
        const id = match[1];
        if (!seenIds.has(id)) {
          seenIds.add(id);
          videos.push({
            id,
            title: `YouTube Video (${id})`,
            channel: 'YouTube',
            duration: '',
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
          });
          if (videos.length >= 10) break;
        }
      }
    }

    return res.status(200).json({ results: videos.slice(0, 15) });
  } catch (error: any) {
    console.error('YouTube Search Handler Error:', error);
    return res.status(200).json({ results: [], error: error.message });
  }
}
