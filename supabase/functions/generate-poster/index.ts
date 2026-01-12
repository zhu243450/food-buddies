import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile and invite code
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('user_id', user.id)
      .single();

    const { data: inviteData } = await supabase
      .from('user_invite_codes')
      .select('invite_code, successful_invites')
      .eq('user_id', user.id)
      .single();

    const nickname = profile?.nickname || '饭友';
    const inviteCode = inviteData?.invite_code || 'XXXXX';
    const successfulInvites = inviteData?.successful_invites || 0;

    // Generate poster image using AI
    const prompt = `Create a beautiful social media invite card poster in Chinese style with these elements:
    - Title: "一起来约饭吧!" (Let's have dinner together!)
    - App name: "约饭" at top
    - Invite code prominently displayed: "${inviteCode}"
    - User info: "${nickname}" has invited ${successfulInvites} friends
    - Call to action: "扫码加入，一起发现美食"
    - Modern gradient background with warm food colors (orange, red tones)
    - Include decorative food icons (chopsticks, bowl, steam)
    - Professional app poster design, clean and inviting
    - QR code placeholder area at bottom
    - Aspect ratio: portrait 9:16
    - Style: Modern Chinese app promotion poster
    The poster should look professional and shareable on WeChat/social media.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image generated');
    }

    // Upload to Supabase storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `posters/${user.id}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('dinner-photos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Return base64 image directly if upload fails
      return new Response(JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        inviteCode,
        isBase64: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: publicUrl } = supabase.storage
      .from('dinner-photos')
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({
      success: true,
      imageUrl: publicUrl.publicUrl,
      inviteCode,
      isBase64: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
