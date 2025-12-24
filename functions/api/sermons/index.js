// Helper:  Haal user email op uit Cloudflare Access headers
function getUserEmail(request) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  
  if (!email) {
    throw new Error('Not authenticated - Cloudflare Access header missing');
  }
  
  return email. toLowerCase(); // Normaliseer naar lowercase
}

export async function onRequestGet(context) {
  try {
    const userEmail = getUserEmail(context. request);
    const url = new URL(context.request. url);
    const search = url.searchParams.get('search');
    
    // Filter op user_id - gebruiker ziet ALLEEN eigen preken
    let query = `
      SELECT s.* 
      FROM sermons s 
      WHERE s.user_id = ? 
    `;
    const params = [userEmail];
    
    if (search) {
      query += ' AND (s.location LIKE ? OR s.preacher LIKE ?  OR s.core_text LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY s.sermon_date DESC';
    
    const stmt = context.env.DB. prepare(query);
    const { results } = await stmt.bind(... params).all();
    
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error. message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const userEmail = getUserEmail(context.request);
    const data = await context.request.json();
    
    // Voeg user_id toe bij INSERT
    const sermonResult = await context.env.DB.prepare(
      `INSERT INTO sermons 
       (user_id, location, preacher, sermon_date, core_text) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userEmail,  // ← USER ID!  
      data.sermon.location,
      data.sermon.preacher,
      data.sermon.sermon_date,
      data.sermon.core_text
    ).run();

    const sermonId = sermonResult.meta.last_row_id;

    // Insert passages (blijft hetzelfde)
    for (const passage of data.passages) {
      await context.env.DB.prepare(
        `INSERT INTO sermon_passages 
         (sermon_id, book_id, chapter_start, verse_start, chapter_end, verse_end, is_main_passage, passage_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
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

    // Insert points (blijft hetzelfde)
    for (const point of data. points) {
      await context. env.DB.prepare(
        `INSERT INTO sermon_points 
         (sermon_id, point_type, point_order, title, content) 
         VALUES (?, ?, ?, ?, ? )`
      ).bind(
        sermonId,
        point. point_type,
        point. point_order,
        point. title,
        point.content
      ).run();
    }

    return Response.json({ success: true, sermon_id: sermonId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}