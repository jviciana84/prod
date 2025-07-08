import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getBlobUrlForLocalPath } from "@/lib/avatars/blob-storage" // Importar la función de conversión de URL

// Usar las variables de entorno correctas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log("🔧 Configuración Supabase:", {
  url: supabaseUrl ? "Definida" : "No definida",
  serviceKey: supabaseServiceKey ? "Definida" : "No definida",
  anonKey: supabaseAnonKey ? "Definida" : "No definida"
})

// Temporalmente usar anon key para pruebas
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: Request) {
  try {
    console.log("🔄 Iniciando carga de usuarios...")
    const startTime = Date.now()

    // Obtener usuarios con sus roles usando una consulta simple
    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        phone,
        position,
        alias,
        avatar_url,
        role,
        created_at,
        welcome_email_sent
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Procesar los usuarios y sus roles y convertir avatar_url si es necesario
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        let finalAvatarUrl = user.avatar_url
        // Si la URL del avatar parece una ruta local, intentar convertirla a una URL de Blob
        if (finalAvatarUrl && finalAvatarUrl.startsWith("/avatars/")) {
          const blobUrl = await getBlobUrlForLocalPath(finalAvatarUrl)
          if (blobUrl) {
            finalAvatarUrl = blobUrl
          } else {
            console.warn(`⚠️ No se pudo obtener URL de Blob para la ruta local: ${finalAvatarUrl}`)
            // Fallback a placeholder si no se puede resolver
            finalAvatarUrl = "/placeholder.svg"
          }
        } else if (!finalAvatarUrl) {
          // Si no hay URL de avatar, usar placeholder
          finalAvatarUrl = "/placeholder.svg"
        }

        // Construir roles desde el campo role de profiles
        let roles = []
        if (user.role) {
          // Si el role es una cadena, dividirla por comas
          if (typeof user.role === 'string') {
            roles = user.role.split(", ").map((roleName: string) => ({
              id: roleName.toLowerCase(),
              name: roleName.trim(),
            }))
          } else {
            // Si es un solo rol
            roles = [{
              id: user.role.toLowerCase(),
              name: user.role,
            }]
          }
        }

        return {
          ...user,
          avatar_url: finalAvatarUrl, // Usar la URL de Blob o placeholder
          roles: roles,
        }
      }),
    )

    const endTime = Date.now()
    console.log(`✅ Usuarios cargados en ${endTime - startTime}ms. Total: ${usersWithRoles.length}`)

    return NextResponse.json(usersWithRoles)
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("🔄 Iniciando creación de usuario...")
    console.log("🔧 Variables de entorno:", {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Definida" : "No definida",
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Definida" : "No definida"
    })

    const body = await request.json()
    const { email, fullName, alias, phone, position, roleId, avatarUrl, skipWelcomeEmail } = body

    console.log("📝 Datos recibidos:", { email, fullName, alias, phone, position, roleId, skipWelcomeEmail })

    // Validar datos requeridos
    if (!email || !fullName) {
      console.error("❌ Datos requeridos faltantes:", { email: !!email, fullName: !!fullName })
      return NextResponse.json({ message: "Email y nombre completo son requeridos" }, { status: 400 })
    }

    console.log("✅ Validación de datos completada")

    console.log("🔍 PASO 1: Verificando si el usuario ya existe en profiles...")
    const { data: existingProfile, error: checkProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle()

    if (checkProfileError) {
      console.error("❌ Error verificando profile existente:", checkProfileError)
      return NextResponse.json({ message: checkProfileError.message }, { status: 500 })
    }

    if (existingProfile) {
      console.log("⚠️ Usuario ya existe en profiles:", existingProfile.id)
      return NextResponse.json(
        {
          message: `El usuario con email ${email} ya existe en el sistema`,
        },
        { status: 409 },
      )
    }

    // PASO 2: Verificar si el usuario ya existe en auth.users
    const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers()

    if (authListError) {
      console.error("Error listing auth users:", authListError)
      return NextResponse.json({ message: "Error checking existing users" }, { status: 500 })
    }

    const existingAuthUser = authUsers?.users?.find((user) => user.email === email)

    if (existingAuthUser) {
      console.log("⚠️ Usuario ya existe en auth.users:", existingAuthUser.id)

      // Si existe en auth pero no en profiles, crear el profile
      try {
        // Obtener el nombre del rol si se proporcionó roleId
        let roleName = null
        if (roleId) {
          try {
            const { data: roleData } = await supabaseAdmin.from("roles").select("name").eq("id", roleId).single()

            roleName = roleData?.name || null
          } catch (error) {
            console.error("Error fetching role name:", error)
          }
        }

        const profileData = {
          id: existingAuthUser.id,
          email,
          full_name: fullName,
          alias: alias,
          phone: phone,
          position: position,
          avatar_url: avatarUrl,
          role: roleName,
          welcome_email_sent: skipWelcomeEmail,
        }

        console.log("📝 Datos que se van a insertar en profiles:", profileData)

        const { error: profileError } = await supabaseAdmin.from("profiles").insert([profileData])

        if (profileError) {
          console.error("❌ Error creating profile for existing auth user:", profileError)
          return NextResponse.json({ message: profileError.message }, { status: 500 })
        }

        console.log("✅ Profile creado para usuario existente en auth")
        return NextResponse.json({
          message: "Profile created for existing user",
          user: { id: existingAuthUser.id, email: existingAuthUser.email },
        })
      } catch (error: any) {
        console.error("❌ Error creating profile:", error)
        return NextResponse.json({ message: error.message }, { status: 500 })
      }
    }

    console.log("🔐 PASO 3: Creando usuario en auth.users...")
    console.log("📝 Datos para auth:", { email, fullName, alias, phone, position, avatarUrl })
    
    // PASO 3: Crear nuevo usuario en auth.users
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        alias,
        phone,
        position,
        avatar_url: avatarUrl,
      },
    })

    if (authError) {
      console.error("❌ Error creating user in auth:", authError)
      console.error("❌ Error details:", {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        name: authError.name
      })
      return NextResponse.json({ 
        message: "Database error creating new user",
        details: authError.message,
        error_code: authError.code
      }, { status: 500 })
    }

    if (!newUser?.user?.id) {
      console.error("❌ Error creating user: No user data returned")
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
    }

    console.log("✅ Usuario creado en auth:", newUser.user.id)

    // PASO 4: Crear profile con retry en caso de conflicto
    let profileCreated = false
    let retryCount = 0
    const maxRetries = 3

    while (!profileCreated && retryCount < maxRetries) {
      try {
        // Obtener el nombre del rol si se proporcionó roleId
        let roleName = null
        if (roleId) {
          try {
            const { data: roleData } = await supabaseAdmin.from("roles").select("name").eq("id", roleId).single()

            roleName = roleData?.name || null
          } catch (error) {
            console.error("Error fetching role name:", error)
          }
        }

        const profileData = {
          id: newUser.user.id,
          email,
          full_name: fullName,
          alias: alias,
          phone: phone,
          position: position,
          avatar_url: avatarUrl,
          role: roleName,
          welcome_email_sent: skipWelcomeEmail,
        }

        console.log("📝 Datos que se van a insertar en profiles:", profileData)

        const { error: profileError } = await supabaseAdmin.from("profiles").insert([profileData])

        if (profileError) {
          if (profileError.code === "23505") {
            // Duplicate key error
            console.log(`⚠️ Intento ${retryCount + 1}: Profile ya existe, verificando...`)

            // Verificar si el profile existe
            const { data: existingProfileCheck } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("id", newUser.user.id)
              .single()

            if (existingProfileCheck) {
              console.log("✅ Profile ya existe, continuando...")
              profileCreated = true
            } else {
              throw profileError
            }
          } else {
            throw profileError
          }
        } else {
          console.log("✅ Profile creado exitosamente")
          profileCreated = true
        }
      } catch (error: any) {
        retryCount++
        console.error(`❌ Error en intento ${retryCount}:`, error)

        if (retryCount >= maxRetries) {
          // Eliminar el usuario de auth.users si falla la creación del perfil
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
          return NextResponse.json({ message: error.message }, { status: 500 })
        }

        // Esperar un poco antes del siguiente intento
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // PASO 5: Enviar correo de bienvenida si es necesario
    if (!skipWelcomeEmail) {
      try {
        const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

        if (emailError) {
          console.error("⚠️ Error sending welcome email:", emailError)
        } else {
          console.log("✅ Correo de bienvenida enviado")
        }
      } catch (emailErr) {
        console.error("⚠️ Error sending welcome email:", emailErr)
      }
    }

    console.log("✅ Usuario creado exitosamente:", newUser.user.id)
    
    return NextResponse.json({
      message: "User created successfully",
      user: { id: newUser.user.id, email: newUser.user.email },
    })
  } catch (error: any) {
    console.error("❌ Unexpected error:", error)
    console.error("❌ Error stack:", error.stack)
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      code: error.code
    })
    return NextResponse.json({ 
      message: "Database error creating new user",
      details: error.message || "Internal Server Error" 
    }, { status: 500 })
  }
}
