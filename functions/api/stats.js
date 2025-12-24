export async function onRequestGet(context) {
  try {
    const totalSermons = await context.env. DB.prepare(
      'SELECT COUNT(*) as count FROM sermons'
    ).first();
    
    const totalPreachers = await context.env.DB.prepare(
      'SELECT COUNT(DISTINCT preacher) as count FROM sermons'
    ).first();
    
    const thisYear = new Date().getFullYear();
    const sermonsThisYear = await context. env.DB.prepare(
      'SELECT COUNT(*) as count FROM sermons WHERE strftime("%Y", sermon_date) = ?'
    ).bind(thisYear. toString()).first();
    
    const { results: preacherStats } = await context. env.DB.prepare(
      'SELECT preacher, COUNT(*) as count FROM sermons GROUP BY preacher ORDER BY count DESC'
    ).all();
    
    const { results: occasionStats } = await context.env.DB.prepare(
      'SELECT o.name, COUNT(s.id) as count FROM sermons s LEFT JOIN occasions o ON s.occasion_id = o.id GROUP BY o.name ORDER BY count DESC'
    ).all();
    
    const { results: bookStats } = await context.env. DB.prepare(
      'SELECT b.name, COUNT(sp.id) as count FROM sermon_passages sp JOIN bible_books b ON sp.bible_book_id = b.id GROUP BY b. name ORDER BY count DESC LIMIT 10'
    ).all();

    return Response.json({
      totalSermons:  totalSermons.count,
      totalPreachers: totalPreachers.count,
      sermonsThisYear: sermonsThisYear.count,
      preacherStats,
      occasionStats,
      bookStats
    });
  } catch (error) {
    return Response.json({ error: error. message }, { status: 500 });
  }
}