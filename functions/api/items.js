// Get all items
export async function onRequestGet(context) {
  const { DB } = context.env;
  
  try {
    const { results } = await DB.prepare(
      "SELECT * FROM items ORDER BY id DESC"
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Create new item
export async function onRequestPost(context) {
  const { DB } = context.env;
  
  try {
    const data = await context.request.json();
    const { name, description } = data;
    
    const result = await DB.prepare(
      "INSERT INTO items (name, description) VALUES (?, ?)"
    ).bind(name, description).run();
    
    return new Response(JSON.stringify({ 
      success: true, 
      id: result.meta.last_row_id 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers:  { 'Content-Type': 'application/json' }
    });
  }
}

// Update item
export async function onRequestPut(context) {
  const { DB } = context.env;
  
  try {
    const data = await context.request.json();
    const { id, name, description } = data;
    
    await DB.prepare(
      "UPDATE items SET name = ?, description = ? WHERE id = ?"
    ).bind(name, description, id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete item
export async function onRequestDelete(context) {
  const { DB } = context.env;
  
  try {
    const url = new URL(context.request. url);
    const id = url.searchParams.get('id');
    
    await DB.prepare(
      "DELETE FROM items WHERE id = ?"
    ).bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type':  'application/json' }
    });
  }
}
