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

// Usar service role key para operaciones de administración
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: Request) {
  try {
    console.log("🔄 Iniciando carga de usuarios...")
    
    // Verificar configuración de Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variables de entorno de Supabase no configuradas")
      return NextResponse.json({ 
        error: "Configuración de base de datos no disponible. Contacta al administrador." 
      }, { status: 500 })
    }
    
    // Verificar autenticación (temporalmente deshabilitado para debug)
    const authHeader = request.headers.get('authorization')
    console.log("🔍 Auth header:", authHeader ? "Presente" : "Ausente")
    
    // TODO: Restaurar verificación de autenticación cuando se resuelva el problema
    // if (!authHeader) {
    //   console.log("❌ No hay header de autorización")
    //   return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    // }
    
    const startTime = Date.now()

    console.log("🔍 Configuración Supabase:", {
      url: supabaseUrl ? "Definida" : "No definida",
      serviceKey: supabaseServiceKey ? "Definida" : "No definida",
      anonKey: supabaseAnonKey ? "Definida" : "No definida"
    })

    // Usar una consulta simple para evitar problemas con relaciones complejas
    console.log("🔍 Ejecutando consulta a Supabase...")
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
      console.error("❌ Error fetching users:", error)
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Consulta exitosa, usuarios obtenidos:", users?.length || 0)
    
    // Si no hay usuarios, devolver array vacío
    if (!users || users.length === 0) {
      console.log("ℹ️ No se encontraron usuarios en la base de datos")
      return NextResponse.json([])
    }

    // Procesar los usuarios y sus roles
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        let finalAvatarUrl = user.avatar_url
        // Si la URL del avatar parece una ruta local, intentar convertirla a una URL de Blob
        if (finalAvatarUrl && finalAvatarUrl.startsWith("/avatars/")) {
          try {
            const blobUrl = await getBlobUrlForLocalPath(finalAvatarUrl)
            if (blobUrl) {
              finalAvatarUrl = blobUrl
            } else {
              console.warn(`⚠️ No se pudo obtener URL de Blob para la ruta local: ${finalAvatarUrl}`)
              finalAvatarUrl = "/placeholder.svg"
            }
          } catch (blobError) {
            console.warn(`⚠️ Error al procesar avatar: ${blobError}`)
            finalAvatarUrl = "/placeholder.svg"
          }
        } else if (!finalAvatarUrl) {
          // Si no hay URL de avatar, usar placeholder
          finalAvatarUrl = "/placeholder.svg"
        }

        // Construir roles desde el campo role simple
        let roles = []
        if (user.role) {
          if (typeof user.role === 'string') {
            roles = user.role.split(", ").map((roleName: string) => ({
              id: roleName.toLowerCase(),
              name: roleName.trim(),
            }))
          } else {
            roles = [{
              id: user.role.toLowerCase(),
              name: user.role,
            }]
          }
        }

        return {
          ...user,
          avatar_url: finalAvatarUrl,
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

    // PASO 2: Verificar si el usuario ya existe en auth.users (opcional)
    let existingAuthUser = null
    try {
      console.log("🔍 Verificando usuarios existentes en auth...")
      console.log("🔧 Usando service key:", supabaseServiceKey ? "✅ Presente" : "❌ Ausente")
      
    const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers()

    if (authListError) {
        console.error("❌ Error listando usuarios en auth:", authListError)
        console.error("❌ Error details:", {
          message: authListError.message,
          status: authListError.status,
          code: authListError.code
        })
        console.warn("⚠️ No se pudo verificar usuarios existentes (continuando):", authListError.message)
        // No fallar aquí, continuar con la creación
      } else {
        console.log("✅ Lista de usuarios obtenida:", authUsers?.users?.length || 0, "usuarios")
        existingAuthUser = authUsers?.users?.find((user) => user.email === email)
        if (existingAuthUser) {
          console.log("⚠️ Usuario encontrado en auth.users:", existingAuthUser.id)
        } else {
          console.log("✅ Email no encontrado en auth.users, continuando con creación")
        }
      }
    } catch (error) {
      console.error("❌ Error inesperado en verificación de auth users:", error)
      console.warn("⚠️ Continuando con la creación...")
      // No fallar aquí, continuar con la creación
    }

    if (existingAuthUser) {
      console.log("⚠️ Usuario ya existe en auth.users:", existingAuthUser.id)

      // Si existe en auth pero no en profiles, crear el profile
      try {
        // Obtener el nombre del rol si se proporcionó roleId
        let roleName = null
        if (roleId) {
          try {
            console.log("🔍 Obteniendo nombre del rol para ID:", roleId)
            const { data: roleData, error: roleError } = await supabaseAdmin.from("roles").select("name").eq("id", roleId).single()
            
            if (roleError) {
              console.error("❌ Error obteniendo rol:", roleError)
            } else {
              roleName = roleData?.name || null
              console.log("✅ Nombre del rol obtenido:", roleName)
            }
          } catch (error) {
            console.error("❌ Error inesperado obteniendo rol:", error)
          }
        }

        const profileData = {
          email,
          full_name: fullName,
          alias: alias,
          phone: phone,
          position: position,
          avatar_url: avatarUrl,
          role: roleName,
          welcome_email_sent: skipWelcomeEmail,
        }

        console.log("📝 Datos que se van a actualizar en profiles:", profileData)

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(profileData)
          .eq("id", existingAuthUser.id)

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
    console.log("🔧 Service key length:", supabaseServiceKey?.length || 0)
    
    // PASO 3: Crear nuevo usuario en auth.users
    let newUser
    try {
      console.log("🔄 Llamando a createUser...")
      const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

      console.log("📊 Respuesta de createUser:")
      console.log("- userData:", userData)
      console.log("- authError:", authError)

    if (authError) {
      console.error("❌ Error creating user in auth:", authError)
      console.error("❌ Error details:", {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        name: authError.name
      })
      return NextResponse.json({ 
          message: "Error creando usuario en el sistema de autenticación",
        details: authError.message,
          error_code: "AUTH_ERROR"
      }, { status: 500 })
    }

      if (!userData?.user?.id) {
      console.error("❌ Error creating user: No user data returned")
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
    }

      newUser = userData
    console.log("✅ Usuario creado en auth:", newUser.user.id)
    } catch (error: any) {
      console.error("❌ Error inesperado en createUser:", error)
      console.error("❌ Error stack:", error.stack)
      return NextResponse.json({ 
        message: "Error inesperado creando usuario",
        details: error.message,
        error_code: "UNEXPECTED_ERROR"
      }, { status: 500 })
    }

    // PASO 4: Actualizar profile (el trigger ya lo creó automáticamente)
    console.log("👤 PASO 4: Actualizando profile...")
    
        // Obtener el nombre del rol si se proporcionó roleId
        let roleName = null
        if (roleId) {
          try {
            console.log("🔍 Obteniendo nombre del rol para ID:", roleId)
            const { data: roleData, error: roleError } = await supabaseAdmin.from("roles").select("name").eq("id", roleId).single()
            
            if (roleError) {
              console.error("❌ Error obteniendo rol:", roleError)
            } else {
              roleName = roleData?.name || null
              console.log("✅ Nombre del rol obtenido:", roleName)
            }
          } catch (error) {
            console.error("❌ Error inesperado obteniendo rol:", error)
          }
        }

        const profileData = {
          email,
          full_name: fullName,
          alias: alias,
          phone: phone,
          position: position,
          avatar_url: avatarUrl,
          role: roleName,
          welcome_email_sent: skipWelcomeEmail,
        }

        console.log("📝 Datos que se van a actualizar en profiles:", profileData)

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(profileData)
          .eq("id", newUser.user.id)

        if (profileError) {
      console.error("❌ Error updating profile:", profileError)
      // Limpiar usuario de auth si falla el profile
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ 
        message: "Error actualizando perfil del usuario",
        details: profileError.message,
        error_code: "PROFILE_ERROR"
      }, { status: 500 })
    }

    console.log("✅ Profile actualizado exitosamente")

    // PASO 5: Enviar correo de bienvenida si es necesario
    if (!skipWelcomeEmail) {
      try {
        console.log("📧 Enviando correo de bienvenida personalizado...")
        
        // Usar el endpoint personalizado para enviar email de bienvenida
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/users/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`, // Usar service key para autenticación
          },
          body: JSON.stringify({
            userId: newUser.user.id,
            email: email
          })
        })

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.error("⚠️ Error sending welcome email:", errorData.message)
        } else {
          console.log("✅ Correo de bienvenida enviado exitosamente")
        }
      } catch (emailErr) {
        console.error("⚠️ Error sending welcome email:", emailErr)
      }
    } else {
      console.log("⏭️ Saltando envío de correo de bienvenida (skipWelcomeEmail = true)")
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
