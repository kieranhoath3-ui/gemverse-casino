     1	import { NextRequest, NextResponse } from 'next/server'
     2	import bcrypt from 'bcryptjs'
     3	import { PrismaClient } from '@prisma/client'
     4	import { v4 as uuidv4 } from 'uuid'
     5	
     6	const prisma = new PrismaClient()
     7	
     8	export async function POST(request: NextRequest) {
     9	  try {
    10	    const { username, password, email, referral_code } = await request.json()
    11	
    12	    // Validate input
    13	    if (!username || !password) {
    14	      return NextResponse.json(
    15	        { success: false, error: 'Username and password are required' },
    16	        { status: 400 }
    17	      )
    18	    }
    19	
    20	    if (password.length < 6) {
    21	      return NextResponse.json(
    22	        { success: false, error: 'Password must be at least 6 characters' },
    23	        { status: 400 }
    24	      )
    25	    }
    26	
    27	    // Check if user already exists
    28	    const existingUser = await prisma.user.findUnique({
    29	      where: { username }
    30	    })
    31	
    32	    if (existingUser) {
    33	      return NextResponse.json(
    34	        { success: false, error: 'Username already taken' },
    35	        { status: 400 }
    36	      )
    37	    }
    38	
    39	    // Hash password
    40	    const password_hash = await bcrypt.hash(password, 12)
    41	
    42	    // Check if this is the first user (will be OWNER)
    43	    const userCount = await prisma.user.count()
    44	    const isFirstUser = userCount === 0
    45	
    46	    // Create user
    47	    const user = await prisma.user.create({
    48	      data: {
    49	        username,
    50	        password_hash,
    51	        email,
    52	        role: isFirstUser ? 'OWNER' : 'PLAYER',
    53	        gems: BigInt(isFirstUser ? 1000000 : 1000),
    54	        level: isFirstUser ? 100 : 1,
    55	      }
    56	    })
    57	
    58	    // Handle referral if provided
    59	    if (referral_code) {
    60	      const referrer = await prisma.user.findFirst({
    61	        where: { username: referral_code }
    62	      })
    63	      
    64	      if (referrer) {
    65	        await prisma.user.update({
    66	          where: { user_id: user.user_id },
    67	          data: { referred_by_id: referrer.user_id }
    68	        })
    69	        
    70	        // Give bonus to referrer
    71	        await prisma.user.update({
    72	          where: { user_id: referrer.user_id },
    73	          data: { gems: referrer.gems + BigInt(100) }
    74	        })
    75	      }
    76	    }
    77	
    78	    // Create session
    79	    const sessionToken = uuidv4()
    80	    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    81	
    82	    await prisma.session.create({
    83	      data: {
    84	        session_token: sessionToken,
    85	        user_id: user.user_id,
    86	        expires
    87	      }
    88	    })
    89	
    90	    // Return user data without password
    91	    const { password_hash: _, ...userWithoutPassword } = user
    92	    
    93	    const response = NextResponse.json({
    94	      success: true,
    95	      user: {
    96	        ...userWithoutPassword,
    97	        gems: userWithoutPassword.gems.toString(),
    98	        crystals: userWithoutPassword.crystals.toString(),
    99	        xp: userWithoutPassword.xp.toString()
   100	      }
   101	    })
   102	
   103	    // Set session cookie
   104	    response.cookies.set('session-token', sessionToken, {
   105	      httpOnly: true,
   106	      secure: process.env.NODE_ENV === 'production',
   107	      sameSite: 'lax',
   108	      expires
   109	    })
   110	
   111	    return response
   112	
   113	  } catch (error) {
   114	    console.error('Registration error:', error)
   115	    return NextResponse.json(
   116	      { success: false, error: 'Internal server error' },
   117	      { status: 500 }
   118	    )
   119	  }
   120	}
