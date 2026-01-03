import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, role, setup_key } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get setup key from environment variable (secure secret)
    const SETUP_KEY = Deno.env.get('ADMIN_SETUP_KEY');
    
    // Validate setup key from secure environment variable
    if (!setup_key || !SETUP_KEY || setup_key !== SETUP_KEY) {
      console.log('Invalid or missing setup key');
      return new Response(
        JSON.stringify({ error: 'Chave de setup inválida' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Setup key verified, proceeding with password reset');

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // List all users to find the one with this email
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: listError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUser = usersData.users.find(u => u.email === email);
    
    if (!targetUser) {
      console.log('User not found:', email);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found user ${email} with id ${targetUser.id}`);

    // Update password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUser.id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if role already exists
    const { data: existingRole } = await adminClient
      .from('user_roles')
      .select('*')
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (!existingRole) {
      // Add role
      const validRoles = ['admin', 'vendedor', 'financeiro'];
      const userRole = validRoles.includes(role) ? role : 'admin';
      
      const { error: insertError } = await adminClient
        .from('user_roles')
        .insert({ user_id: targetUser.id, role: userRole, email: email });

      if (insertError) {
        console.error('Error inserting role:', insertError);
      } else {
        console.log(`Added role ${userRole} for user ${email}`);
      }
    } else {
      console.log(`User ${email} already has role ${existingRole.role}`);
    }

    console.log(`Password reset successful for user ${email}`);

    return new Response(
      JSON.stringify({ success: true, user_id: targetUser.id }),
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
