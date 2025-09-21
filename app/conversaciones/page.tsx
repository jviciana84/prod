import { ConversationManager } from '@/components/ai-assistant/conversation-manager'

export default function ConversacionesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Conversaciones</h1>
        <p className="text-gray-600 mt-2">
          Aquí puedes ver, gestionar y eliminar tus conversaciones con Edelweiss AI
        </p>
      </div>
      
      <ConversationManager />
    </div>
  )
}
