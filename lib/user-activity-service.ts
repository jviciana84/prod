import { createClient } from '@/utils/supabase/client'

export interface UserActivity {
  id: string
  type: 'login' | 'vehicle_view' | 'sale' | 'contact' | 'search' | 'system'
  description: string
  timestamp: Date
  metadata?: Record<string, any>
  user_id: string
  user_email: string
  user_name: string
  // Campos adicionales para compatibilidad con UserCard
  action?: string
  details?: string
  resource?: string
  price?: number
  payment_method?: string
  badge?: string
  created_at?: string
}

class UserActivityService {
  private supabase = createClient()

  async getUserActivities(
    userId: string, 
    userEmail: string, 
    userName: string,
    limit: number = 10
  ): Promise<UserActivity[]> {
    try {
      // Solo obtener actividades reales de la base de datos
      const activities = await this.getRealUserActivities(userId, userEmail, userName, limit)
      
      // Si no hay actividades reales, devolver array vacío
      return activities
    } catch (error) {
      console.error('Error en getUserActivities:', error)
      // No generar actividades falsas, devolver array vacío
      return []
    }
  }

  private async getRealUserActivities(
    userId: string, 
    userEmail: string, 
    userName: string,
    limit: number
  ): Promise<UserActivity[]> {
    try {
      const activities: UserActivity[] = []

      console.log(`🔍 Buscando último acceso para: ${userName} (${userEmail})`)

      // 1. Buscar en la tabla profiles para obtener información de último acceso
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id, full_name, email, created_at, updated_at, last_sign_in_at')
        .eq('id', userId)
        .single()

      console.log('👤 Perfil del usuario:', profile)

      if (profile) {
        // Usar last_sign_in_at si está disponible, sino usar updated_at
        const lastAccess = profile.last_sign_in_at || profile.updated_at || profile.created_at
        
        if (lastAccess) {
          activities.push({
            id: `access-${userId}`,
            type: 'login',
            description: 'Último acceso al sistema',
            timestamp: new Date(lastAccess),
            user_id: userId,
            user_email: userEmail,
            user_name: userName,
            action: 'login',
            details: 'Último acceso al sistema',
            resource: 'Sistema',
            badge: 'Acceso',
            created_at: lastAccess
          })
        }

        // Si el usuario se registró recientemente, mostrar esa información
        const registrationDate = new Date(profile.created_at)
        const now = new Date()
        const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceRegistration <= 7) {
          activities.push({
            id: `registration-${userId}`,
            type: 'system',
            description: `Usuario registrado hace ${daysSinceRegistration} días`,
            timestamp: registrationDate,
            user_id: userId,
            user_email: userEmail,
            user_name: userName,
            action: 'create',
            details: `Usuario registrado hace ${daysSinceRegistration} días`,
            resource: 'Sistema',
            badge: 'Registro',
            created_at: profile.created_at
          })
        }
      }

      // 2. Buscar en auth.users para obtener información de autenticación
      const { data: authUser } = await this.supabase.auth.getUser()
      
      if (authUser.user) {
        const lastSignIn = authUser.user.last_sign_in_at
        if (lastSignIn) {
          // Solo agregar si es diferente al último acceso del perfil
          const profileLastAccess = profile?.last_sign_in_at
          if (!profileLastAccess || new Date(lastSignIn) > new Date(profileLastAccess)) {
            activities.push({
              id: `auth-${userId}`,
              type: 'login',
              description: 'Sesión activa en el sistema',
              timestamp: new Date(lastSignIn),
              user_id: userId,
              user_email: userEmail,
              user_name: userName,
              action: 'login',
              details: 'Sesión activa en el sistema',
              resource: 'Autenticación',
              badge: 'Sesión',
              created_at: lastSignIn
            })
          }
        }
      }

      // 3. Buscar en logs de actividad si existe la tabla
      try {
        const { data: activityLogs } = await this.supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(2)

        if (activityLogs && activityLogs.length > 0) {
          activityLogs.forEach((log) => {
            activities.push({
              id: `log-${log.id}`,
              type: log.type || 'system',
              description: log.description || 'Actividad del sistema',
              timestamp: new Date(log.created_at),
              user_id: userId,
              user_email: userEmail,
              user_name: userName,
              action: log.type || 'system',
              details: log.description || 'Actividad del sistema',
              resource: 'Logs',
              badge: 'Actividad',
              created_at: log.created_at
            })
          })
        }
      } catch (error) {
        console.log('ℹ️ Tabla user_activities no disponible')
      }

      // Ordenar todas las actividades por fecha y limitar
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      console.log(`✅ Total actividades de acceso encontradas para ${userName}: ${sortedActivities.length}`)
      if (sortedActivities.length > 0) {
        console.log('📋 Actividades de acceso:', sortedActivities.map(a => ({ tipo: a.type, descripcion: a.description, fecha: a.timestamp })))
      }

      return sortedActivities
    } catch (error) {
      console.error('Error obteniendo actividades de acceso:', error)
      return []
    }
  }


  async logActivity(
    userId: string,
    userEmail: string,
    userName: string,
    type: UserActivity['type'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          type,
          description,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error al registrar actividad:', error)
      }
    } catch (error) {
      console.error('Error en logActivity:', error)
    }
  }
}

export const userActivityService = new UserActivityService()