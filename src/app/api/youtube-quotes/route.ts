import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const match = url.trim().match(p);
    if (match) return match[1];
  }
  return null;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a YouTube URL' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch transcript
    let transcript: { text: string; offset: number; duration: number }[];
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId);
    } catch {
      return NextResponse.json(
        { error: 'Could not fetch transcript. Make sure the video has captions/subtitles enabled.' },
        { status: 400 }
      );
    }

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript available for this video' }, { status: 400 });
    }

    // Build timestamped transcript text
    const transcriptWithTimestamps = transcript.map((t) => {
      const ts = formatTimestamp(t.offset / 1000);
      return `[${ts}] ${t.text}`;
    }).join('\n');

    // Use OpenAI to extract quotes
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert content analyst. Extract the most powerful, insightful, and memorable quotes from video transcripts.

For each quote:
- Extract the EXACT words from the transcript (clean up filler words like "um", "uh", "you know" but keep the meaning intact)
- Include the timestamp where the quote starts
- Provide brief context about what the speaker is discussing

Return JSON in this format:
{
  "videoTitle": "Best guess at the video title based on content",
  "quotes": [
    {
      "quote": "The exact quote from the video",
      "timestamp": "M:SS or H:MM:SS format",
      "context": "Brief 1-sentence context about what's being discussed"
    }
  ]
}

Extract 5-10 of the best quotes. Focus on:
- Key insights and takeaways
- Emotional or impactful statements
- Actionable advice
- Surprising facts or statistics
- Memorable phrases`,
        },
        {
          role: 'user',
          content: `Extract the best quotes from this video transcript:\n\n${transcriptWithTimestamps}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Failed to extract quotes from transcript' }, { status: 500 });
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      videoTitle: result.videoTitle || 'Untitled Video',
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      quotes: (result.quotes || []).map((q: any) => ({
        quote: q.quote,
        timestamp: q.timestamp,
        context: q.context,
        selected: true,
      })),
      transcriptLength: transcript.length,
    });
  } catch (error) {
    console.error('YouTube quotes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process video' },
      { status: 500 }
    );
  }
}
