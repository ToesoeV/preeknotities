export async function onRequestGet(context) {
  const email = context.request.headers.get('Cf-Access-Authenticated-User-Email');
  const name = context.request.headers.get('Cf-Access-Authenticated-User-Name');
  
  return Response.json({ 
    email:  email || null,
    name: name || null,
    authenticated: !!email
  });
}