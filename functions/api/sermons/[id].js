export async function onRequestGet(context) {
  try {
    const sermonId = context.params.id;
    
    const sermon = await context.env.DB. prepare(
      'SELECT * FROM sermons WHERE id = ?'
    ).bind(sermonId).first();
    
    const { results:  passages } = await context.env. DB.prepare(
      'SELECT sp.*, bb.name as book_name FROM sermon_passages sp JOIN bible_books bb ON sp.bible_book_id = bb.id WHERE sp.sermon_id = ? '
    ).bind(sermonId).all();
    
    const { results: points } = await context.env.DB.prepare(
      'SELECT * FROM sermon_points WHERE sermon_id = ?  ORDER BY point_order'
    ).bind(sermonId).all();
    
    return Response.json({ sermon, passages, points });
  } catch (error) {
    return Response.json({ error: error. message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  try {
    const sermonId = context.params.id;
    
    await context.env.DB.prepare(
      'DELETE FROM sermons WHERE id = ?'
    ).bind(sermonId).run();
    
    return Response. json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}