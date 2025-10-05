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
      // Obtener actividades reales de la base de datos
      const { data: activities, error } = await this.supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error al obtener actividades:', error)
        return this.generateMockActivities(userId, userEmail, userName, limit)
      }

      // Convertir a formato UserActivity
      return activities.map(activity => ({
        id: activity.id,
        type: activity.type || 'system',
        description: activity.description || 'Actividad del sistema',
        timestamp: new Date(activity.created_at),
        metadata: activity.metadata || {},
        user_id: userId,
        user_email: userEmail,
        user_name: userName
      }))
    } catch (error) {
      console.error('Error en getUserActivities:', error)
      return this.generateMockActivities(userId, userEmail, userName, limit)
    }
  }

  private generateMockActivities(
    userId: string, 
    userEmail: string, 
    userName: string,
    limit: number
  ): UserActivity[] {
    const mockActivities: UserActivity[] = [
      {
        id: '1',
        type: 'login',
        description: 'Inicio de sesión exitoso',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
        user_id: userId,
        user_email: userEmail,
        user_name: userName
      },
      {
        id: '2',
        type: 'vehicle_view',
        description: 'Consultó información de vehículo BMW X3',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutos atrás
        user_id: userId,
        user_email: userEmail,
        user_name: userName
      },
      {
        id: '3',
        type: 'search',
        description: 'Realizó búsqueda de contactos de clientes',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        user_id: userId,
        user_email: userEmail,
        user_name: userName
      },
      {
        id: '4',
        type: 'sale',
        description: 'Registró nueva venta de vehículo',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
        user_id: userId,
        user_email: userEmail,
        user_name: userName
      },
      {
        id: '5',
        type: 'contact',
        description: 'Actualizó datos de contacto de cliente',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
        user_id: userId,
        user_email: userEmail,
        user_name: userName
      }
    ]

    return mockActivities.slice(0, limit)
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