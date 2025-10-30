"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  getISOWeek, 
  startOfWeek, 
  endOfWeek,
  isSameDay,
  addMonths,
  subMonths,
  getDay
} from "date-fns"
import { es } from "date-fns/locale"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CalendarioSemanalSelectorProps {
  onSemanaSeleccionada: (inicio: Date, fin: Date, numeroSemana: number) => void
  semanaActual?: { inicio: Date; fin: Date; numero: number } | null
}

export function CalendarioSemanalSelector({ 
  onSemanaSeleccionada, 
  semanaActual 
}: CalendarioSemanalSelectorProps) {
  const [mesVista, setMesVista] = useState(new Date())
  const [open, setOpen] = useState(false)

  const primerDiaMes = startOfMonth(mesVista)
  const ultimoDiaMes = endOfMonth(mesVista)
  const diasDelMes = eachDayOfInterval({ start: primerDiaMes, end: ultimoDiaMes })
  const primerDiaSemana = getDay(primerDiaMes) === 0 ? 6 : getDay(primerDiaMes) - 1
  const diasVaciosInicio = Array(primerDiaSemana).fill(null)
  const todasLasCeldas = [...diasVaciosInicio, ...diasDelMes]
  const semanas: Array<Array<Date | null>> = []
  
  for (let i = 0; i < todasLasCeldas.length; i += 7) {
    semanas.push(todasLasCeldas.slice(i, i + 7))
  }

  const handleClickSemana = (primerDiaSemana: Date) => {
    const inicioSemana = startOfWeek(primerDiaSemana, { weekStartsOn: 1 })
    const finSemana = endOfWeek(primerDiaSemana, { weekStartsOn: 1 })
    const numeroSemana = getISOWeek(primerDiaSemana)
    onSemanaSeleccionada(inicioSemana, finSemana, numeroSemana)
    setOpen(false)
  }

  const esSemanaSeleccionada = (primerDiaSemana: Date | null) => {
    if (!primerDiaSemana || !semanaActual) return false
    const inicioSemana = startOfWeek(primerDiaSemana, { weekStartsOn: 1 })
    return isSameDay(inicioSemana, semanaActual.inicio)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="h-4 w-4 mr-2" />
          {semanaActual ? `Sem. ${semanaActual.numero}` : 'Seleccionar'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {format(mesVista, "MMMM yyyy", { locale: es })}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMesVista(subMonths(mesVista, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMesVista(new Date())}>
                <span className="text-xs">Hoy</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMesVista(addMonths(mesVista, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-2">
            <div className="flex flex-col gap-1">
              <div className="h-6 text-[10px] font-medium text-muted-foreground flex items-center justify-center">S</div>
              {semanas.map((semana, idx) => {
                const primerDia = semana.find(d => d !== null)
                if (!primerDia) return <div key={idx} className="h-7" />
                const numeroSemana = getISOWeek(primerDia)
                const seleccionada = esSemanaSeleccionada(primerDia)
                return (
                  <button
                    key={idx}
                    onClick={() => handleClickSemana(primerDia)}
                    className={`h-7 w-7 text-[10px] font-medium rounded transition-colors ${
                      seleccionada ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    {numeroSemana}
                  </button>
                )
              })}
            </div>

            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia) => (
                  <div key={dia} className="h-6 text-[10px] font-medium text-muted-foreground flex items-center justify-center">
                    {dia}
                  </div>
                ))}
              </div>
              {semanas.map((semana, semanaIdx) => {
                const primerDiaSemana = semana.find(d => d !== null)
                const seleccionada = esSemanaSeleccionada(primerDiaSemana || null)
                return (
                  <div key={semanaIdx} className="grid grid-cols-7 gap-1 mb-1">
                    {semana.map((dia, diaIdx) => (
                      <button
                        key={diaIdx}
                        onClick={() => dia && handleClickSemana(dia)}
                        disabled={!dia}
                        className={`h-7 text-xs rounded transition-colors ${
                          !dia ? 'invisible' : seleccionada
                            ? 'bg-primary/10 border border-primary font-medium'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {dia ? format(dia, 'd') : ''}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
          
          {semanaActual && (
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Sem. {semanaActual.numero}: {format(semanaActual.inicio, "d MMM", { locale: es })} - {format(semanaActual.fin, "d MMM", { locale: es })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
