import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <BMWMSpinner size="lg" />
      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Procesando confirmación...</p>
    </div>
  )
}
