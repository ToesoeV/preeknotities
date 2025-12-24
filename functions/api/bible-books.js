// DEPRECATED: Deze API endpoint is niet meer nodig
// Bible books data is nu statisch in static-data.js
// Behouden voor backwards compatibility

export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM bible_books ORDER BY book_order'
    ).all();
    
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}