// ===== DEPRECATED AND NOT USED =====
// Occasions data is now FULLY LOCAL in static-data.js
// This endpoint is kept for backwards compatibility only
// The frontend NEVER calls this - it uses local OCCASIONS array

export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM occasions ORDER BY name'
    ).all();
    
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}