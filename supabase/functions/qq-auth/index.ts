import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QQTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
}

interface QQUserInfo {
  ret: number
  msg: string
  nickname: string
  figureurl: string
  figureurl_1: string
  figureurl_2: string
  figureurl_qq_1: string
  figureurl_qq_2: string
  gender: string
  is_yellow_vip: string
  vip: string
  yellow_vip_level: string
  level: string
  is_yellow_year_vip: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { code } = await req.json()

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // 获取QQ配置
    const appId = Deno.env.get('QQ_APP_ID')
    const appKey = Deno.env.get('QQ_APP_KEY')
    const redirectUri = Deno.env.get('QQ_REDIRECT_URI') || `${req.headers.get('origin')}/auth`

    if (!appId || !appKey) {
      throw new Error('QQ app credentials not configured')
    }

    console.log('Getting QQ access token with code:', code)

    // 获取QQ访问令牌
    const tokenResponse = await fetch(
      `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${appId}&client_secret=${appKey}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    )

    if (!tokenResponse.ok) {
      throw new Error(`QQ token request failed: ${tokenResponse.status}`)
    }

    const tokenText = await tokenResponse.text()
    
    // QQ返回的是 URL 参数格式，需要解析
    const tokenParams = new URLSearchParams(tokenText)
    const accessToken = tokenParams.get('access_token')

    if (!accessToken) {
      console.error('QQ token error:', tokenText)
      throw new Error('Failed to get QQ access token')
    }

    console.log('Got QQ access token')

    // 获取OpenID
    const openidResponse = await fetch(
      `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}`
    )

    if (!openidResponse.ok) {
      throw new Error(`QQ openid request failed: ${openidResponse.status}`)
    }

    const openidText = await openidResponse.text()
    
    // 解析 JSONP 格式的响应
    const openidMatch = openidText.match(/callback\(\s*(\{.*\})\s*\)/)
    if (!openidMatch) {
      throw new Error('Failed to parse QQ openid response')
    }

    const openidData = JSON.parse(openidMatch[1])
    const openid = openidData.openid

    if (!openid) {
      throw new Error('Failed to get QQ openid')
    }

    console.log('Got QQ openid:', openid)

    // 获取用户信息
    const userResponse = await fetch(
      `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${appId}&openid=${openid}`
    )

    if (!userResponse.ok) {
      throw new Error(`QQ user info request failed: ${userResponse.status}`)
    }

    const userData: QQUserInfo = await userResponse.json()

    if (userData.ret !== 0) {
      throw new Error(`QQ API error: ${userData.msg}`)
    }

    console.log('Got QQ user info for:', userData.nickname)

    // 检查用户是否已存在
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('qq_openid', openid)
      .single()

    let userId: string

    if (existingProfile) {
      // 用户已存在，直接使用
      userId = existingProfile.user_id
      console.log('Existing QQ user found:', userId)
    } else {
      // 创建新用户
      console.log('Creating new user for QQ openid:', openid)
      
      // 创建 Supabase 用户账户
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: `qq_${openid}@temp.com`, // 临时邮箱
        email_confirm: true,
        user_metadata: {
          provider: 'qq',
          qq_openid: openid,
          nickname: userData.nickname,
          avatar_url: userData.figureurl_qq_2 || userData.figureurl_qq_1 || userData.figureurl_2
        }
      })

      if (authError || !authData.user) {
        console.error('Failed to create Supabase user:', authError)
        throw new Error('Failed to create user account')
      }

      userId = authData.user.id

      // 创建用户资料
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: userId,
          nickname: userData.nickname,
          avatar_url: userData.figureurl_qq_2 || userData.figureurl_qq_1 || userData.figureurl_2,
          qq_openid: openid,
          gender: userData.gender === '男' ? '男' : userData.gender === '女' ? '女' : undefined
        })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        // 删除刚创建的用户
        await supabaseClient.auth.admin.deleteUser(userId)
        throw new Error('Failed to create user profile')
      }
    }

    // 生成自定义 JWT token 用于客户端登录
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: `qq_${openid}@temp.com`,
      options: {
        redirectTo: `${req.headers.get('origin')}/my-dinners`
      }
    })

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError)
      throw new Error('Failed to create login session')
    }

    console.log('QQ login successful for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          nickname: userData.nickname,
          avatar_url: userData.figureurl_qq_2 || userData.figureurl_qq_1 || userData.figureurl_2
        },
        session_url: sessionData.properties.action_link
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('QQ auth error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})