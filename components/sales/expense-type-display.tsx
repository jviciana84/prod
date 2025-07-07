import { Badge } from "@/components/ui/badge"

type ExpenseTypeOption = {
  id: number
  name: string
  charge: number
}

type ExpenseTypeDisplayProps = {
  typeId: number
  expenseTypes: ExpenseTypeOption[]
}

export function ExpenseTypeDisplay({ typeId, expenseTypes }: ExpenseTypeDisplayProps) {
  const expenseType = expenseTypes.find((type) => type.id === typeId)

  if (!expenseType) {
    return <span>-</span>
  }

  return (
    <Badge variant="outline" className="font-normal">
      {expenseType.name}
      {expenseType.charge > 0 && (
        <span className="ml-1 text-xs">
          (
          {new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(expenseType.charge)}
          )
        </span>
      )}
    </Badge>
  )
}
