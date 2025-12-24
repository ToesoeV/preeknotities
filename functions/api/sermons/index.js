export async function onRequestGet(context) {
  try {
    const url = new URL(context.request. url);
    const search = url.searchParams.get('search');
    
    let query = 'SELECT s.*, o.name as occasion_name FROM sermons s LEFT JOIN occasions o ON s.occasion_id = o.id';
    const params = [];
    
    if (search) {
      query += ' WHERE (s.location LIKE ? OR s.preacher LIKE ?  OR s.core_text LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY s.sermon_date DESC';
    
    const stmt = context.env.DB.prepare(query);
    const { results } = params.length > 0 
      ? await stmt.bind(...params).all() 
      : await stmt.all();
    
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    
    // Insert sermon
    const sermonResult = await context.env.DB. prepare(
      'INSERT INTO sermons (location, preacher, sermon_date, core_text, occasion_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      data.sermon. location,
      data.sermon. preacher,
      data.sermon.sermon_date,
      data.sermon.core_text,
      data.sermon.occasion_id
    ).run();

    const sermonId = sermonResult.meta.last_row_id;

    // Insert passages
    for (const passage of data.passages) {
      await context.env.DB.prepare(
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
      await context.env.DB.prepare(
        'INSERT INTO sermon_points (sermon_id, point_type, point_order, title, content) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        sermonId,
        point.point_type,
        point.point_order,
        point.title,
        point.content
      ).run();
    }

    return Response.json({ success: true, sermon_id: sermonId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}