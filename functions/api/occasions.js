// DEPRECATED: Deze API endpoint is niet meer nodig
// Occasions data is nu statisch in static-data.js
// Behouden voor backwards compatibility

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