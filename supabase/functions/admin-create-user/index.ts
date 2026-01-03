import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('Received request:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body received:', JSON.stringify({ ...body, password: '[REDACTED]', setup_key: body.setup_key ? '[REDACTED]' : undefined }));
    const { email, password, role, setup_key } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get setup key from environment variable (secure secret)
    const SETUP_KEY = Deno.env.get('ADMIN_SETUP_KEY');

    // If setup_key is provided and matches, allow creating user without auth (for initial setup)
    if (setup_key && SETUP_KEY && setup_key === SETUP_KEY) {
      console.log('Using setup key for initial user creation');
    } else {
      // Normal flow - require admin auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        console.log('No authorization header provided');
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      // Get current user
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        console.log('User authentication failed:', userError?.message);
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Authenticated user:', user.id);

      // Check if user is admin
      const { data: roleData, error: roleError } = await userClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        console.log('User is not admin:', roleError?.message);
        return new Response(
          JSON.stringify({ error: 'Acesso negado. Apenas administradores podem criar usuários.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User role verified:', roleData.role);
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'E-mail e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add role to user_roles table
    const validRoles = ['admin', 'vendedor', 'financeiro'];
    const userRole = validRoles.includes(role) ? role : 'vendedor';
    
    const { error: insertRoleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: userRole, email: email });

    if (insertRoleError) {
      console.error('Error inserting role:', insertRoleError);
    }

    console.log(`User ${email} created with role ${userRole}`);

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
