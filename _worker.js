export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Serveer statische bestanden normaal
  if (! url.pathname.startsWith('/api/')) {
    return context.next();
  }

  // API endpoints
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    if (url.pathname === '/api/bible-books') {
      const { results } = await env.DB. prepare(
        'SELECT * FROM bible_books ORDER BY book_order'
      ).all();
      return new Response(JSON.stringify(results), { headers: corsHeaders });
    }

    if (url.pathname === '/api/occasions') {
      const { results } = await env. DB.prepare(
        'SELECT * FROM occasions ORDER BY name'
      ).all();
      return new Response(JSON.stringify(results), { headers: corsHeaders });
    }

    if (url.pathname === '/api/sermons' && request.method === 'POST') {
      const data = await request.json();
      
      // Insert sermon
      const sermonResult = await env.DB.prepare(
        'INSERT INTO sermons (location, preacher, sermon_date, core_text, occasion_id) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        data.sermon. location,
        data.sermon. preacher,
        data.sermon.sermon_date,
        data.sermon.core_text,
        data.sermon.occasion_id
      ).run();

      const sermonId = sermonResult. meta.last_row_id;

      // Insert passages
      for (const passage of data.passages) {
        await env.DB.prepare(
          'INSERT INTO sermon_passages (sermon_id, bible_book_id, chapter_start, verse_start, chapter_end, verse_end, is_main_passage, passage_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          sermonId,
          passage.bible_book_id,
          passage.chapter_start,
          passage.verse_start,
          passage.chapter_end,
          passage.verse_end,
          passage.is_main_passage,
          passage.passage_url
        ).run();
      }

      // Insert points
      for (const point of data.points) {
        await env.DB.prepare(
          'INSERT INTO sermon_points (sermon_id, point_type, point_order, title, content) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          sermonId,
          point.point_type,
          point.point_order,
          point.title,
          point.content
        ).run();
      }

      return new Response(JSON.stringify({ success: true, sermon_id: sermonId }), { headers: corsHeaders });
    }

    if (url.pathname === '/api/sermons' && request.method === 'GET') {
      const { results } = await env.DB. prepare(
        'SELECT s. *, o.name as occasion_name FROM sermons s LEFT JOIN occasions o ON s.occasion_id = o.id ORDER BY s.sermon_date DESC'
      ).all();
      return new Response(JSON.stringify(results), { headers: corsHeaders });
    }

    if (url. pathname. startsWith('/api/sermons/')) {
      const sermonId = url.pathname.split('/')[3];
      
      if (request.method === 'GET') {
        const sermon = await env.DB.prepare('SELECT * FROM sermons WHERE id = ?').bind(sermonId).first();
        const { results:  passages } = await env.DB. prepare('SELECT * FROM sermon_passages WHERE sermon_id = ?').bind(sermonId).all();
        const { results: points } = await env.DB.prepare('SELECT * FROM sermon_points WHERE sermon_id = ?  ORDER BY point_order').bind(sermonId).all();
        
        return new Response(JSON.stringify({ sermon, passages, points }), { headers: corsHeaders });
      }
      
      if (request.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM sermons WHERE id = ?').bind(sermonId).run();
        return new Response(JSON. stringify({ success: true }), { headers: corsHeaders });
      }
    }

    if (url.pathname === '/api/stats') {
      const totalSermons = await env.DB. prepare('SELECT COUNT(*) as count FROM sermons').first();
      const totalPreachers = await env.DB.prepare('SELECT COUNT(DISTINCT preacher) as count FROM sermons').first();
      const thisYear = new Date().getFullYear();
      const sermonsThisYear = await env.DB. prepare('SELECT COUNT(*) as count FROM sermons WHERE strftime("%Y", sermon_date) = ?').bind(thisYear. toString()).first();
      
      const { results:  preacherStats } = await env. DB.prepare(
        'SELECT preacher, COUNT(*) as count FROM sermons GROUP BY preacher ORDER BY count DESC'
      ).all();
      
      const { results: occasionStats } = await env.DB.prepare(
        'SELECT o.name, COUNT(s.id) as count FROM sermons s LEFT JOIN occasions o ON s.occasion_id = o.id GROUP BY o.name ORDER BY count DESC'
      ).all();
      
      const { results: bookStats } = await env.DB. prepare(
        'SELECT b. name, COUNT(sp.id) as count FROM sermon_passages sp JOIN bible_books b ON sp.bible_book_id = b.id GROUP BY b.name ORDER BY count DESC LIMIT 10'
      ).all();

      return new Response(JSON.stringify({
        totalSermons:  totalSermons.count,
        totalPreachers: totalPreachers.count,
        sermonsThisYear: sermonsThisYear.count,
        preacherStats,
        occasionStats,
        bookStats
      }), { headers: corsHeaders });
    }

    return new Response('Not Found', { status: 404 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}