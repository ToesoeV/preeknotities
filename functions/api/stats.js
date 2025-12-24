function getUserEmail(request) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (!email) throw new Error('Not authenticated');
  return email.toLowerCase();
}

export async function onRequestGet(context) {
  try {
    const userEmail = getUserEmail(context.request);
    
    // Alle statistieken gefilterd op user_id
    const totalSermons = await context.env. DB.prepare(
      'SELECT COUNT(*) as count FROM sermons WHERE user_id = ?'
    ).bind(userEmail).first();
    
    const totalPreachers = await context.env.DB. prepare(
      'SELECT COUNT(DISTINCT preacher) as count FROM sermons WHERE user_id = ? '
    ).bind(userEmail).first();
    
    const thisYear = new Date().getFullYear();
    const sermonsThisYear = await context.env. DB.prepare(
      'SELECT COUNT(*) as count FROM sermons WHERE user_id = ? AND strftime("%Y", sermon_date) = ?'
    ).bind(userEmail, thisYear. toString()).first();
    
    const { results: preacherStats } = await context.env.DB.prepare(
      'SELECT preacher, COUNT(*) as count FROM sermons WHERE user_id = ? GROUP BY preacher ORDER BY count DESC'
    ).bind(userEmail).all();
    
    // Get book stats without JOIN - return bible_book_id and count
    const { results: bookStats } = await context.env.DB.prepare(
      `SELECT sp.bible_book_id, COUNT(sp.id) as count 
       FROM sermon_passages sp 
       JOIN sermons s ON sp.sermon_id = s.id 
       WHERE s.user_id = ? 
       GROUP BY sp.bible_book_id 
       ORDER BY count DESC 
       LIMIT 10`
    ).bind(userEmail).all();

    return Response.json({
      totalSermons: totalSermons.count,
      totalPreachers: totalPreachers.count,
      sermonsThisYear: sermonsThisYear.count,
      preacherStats,
      bookStats
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}