function getUserEmail(request) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (!email) throw new Error('Not authenticated');
  return email.toLowerCase();
}

export async function onRequestGet(context) {
  try {
    const userEmail = getUserEmail(context.request);
    const sermonId = context.params.id;
    
    // Check:  preek moet van deze user zijn
    const sermon = await context.env.DB.prepare(
      'SELECT * FROM sermons WHERE id = ?  AND user_id = ?'
    ).bind(sermonId, userEmail).first();
    
    if (!sermon) {
      return Response.json({ 
        error: 'Preek niet gevonden of geen toegang' 
      }, { status: 404 });
    }
    
    const { results: passages } = await context.env.DB.prepare(
      `SELECT sp.* 
       FROM sermon_passages sp 
       WHERE sp.sermon_id = ?`
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
    const userEmail = getUserEmail(context.request);
    const sermonId = context.params. id;
    
    // Alleen verwijderen als preek van deze user is
    const result = await context.env.DB. prepare(
      'DELETE FROM sermons WHERE id = ? AND user_id = ?'
    ).bind(sermonId, userEmail).run();
    
    if (result.meta.changes === 0) {
      return Response.json({ 
        error: 'Preek niet gevonden of geen toegang' 
      }, { status:  404 });
    }
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}