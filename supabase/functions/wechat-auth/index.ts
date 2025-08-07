import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WechatTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
}

interface WechatUserInfo {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  unionid?: string
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

    // 获取微信配置
    const appId = Deno.env.get('WECHAT_APP_ID')
    const appSecret = Deno.env.get('WECHAT_APP_SECRET')

    if (!appId || !appSecret) {
      throw new Error('WeChat app credentials not configured')
    }

    console.log('Getting WeChat access token with code:', code)

    // 获取微信访问令牌
    const tokenResponse = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    )

    if (!tokenResponse.ok) {
      throw new Error(`WeChat token request failed: ${tokenResponse.status}`)
    }

    const tokenData: WechatTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('WeChat token error:', tokenData)
      throw new Error('Failed to get WeChat access token')
    }

    console.log('Got WeChat access token for openid:', tokenData.openid)

    // 获取用户信息
    const userResponse = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`
    )

    if (!userResponse.ok) {
      throw new Error(`WeChat user info request failed: ${userResponse.status}`)
    }

    const userData: WechatUserInfo = await userResponse.json()

    console.log('Got WeChat user info for:', userData.nickname)

    // 检查用户是否已存在
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('wechat_openid', userData.openid)
      .single()

    let userId: string

    if (existingProfile) {
      // 用户已存在，直接使用
      userId = existingProfile.user_id
      console.log('Existing WeChat user found:', userId)
    } else {
      // 创建新用户
      console.log('Creating new user for WeChat openid:', userData.openid)
      
      // 创建 Supabase 用户账户
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: `wechat_${userData.openid}@temp.com`, // 临时邮箱
        email_confirm: true,
        user_metadata: {
          provider: 'wechat',
          wechat_openid: userData.openid,
          nickname: userData.nickname,
          avatar_url: userData.headimgurl
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
          avatar_url: userData.headimgurl,
          wechat_openid: userData.openid,
          gender: userData.sex === 1 ? '男' : userData.sex === 2 ? '女' : undefined
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
      email: `wechat_${userData.openid}@temp.com`,
      options: {
        redirectTo: `${req.headers.get('origin')}/my-dinners`
      }
    })

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError)
      throw new Error('Failed to create login session')
    }

    console.log('WeChat login successful for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          nickname: userData.nickname,
          avatar_url: userData.headimgurl
        },
        session_url: sessionData.properties.action_link
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('WeChat auth error:', error)
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