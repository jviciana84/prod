"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, StarOff, Home, X, Check, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { availablePages, addToFavorites, removeFromFavorites, getUserPreferences } from "@/lib/user-preferences"
import { createClientComponentClient } from "@/lib/supabase/client"
import type { PageInfo, UserPreferences } from "@/types/user-preferences"
import { toast } from "@/hooks/use-toast"

export function FavoritesManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Obtener el ID del usuario actual y sus preferencias
  useEffect(() => {
    const fetchUserAndPreferences = async () => {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUserId(session.user.id)
        const prefs = await getUserPreferences(session.user.id)
        setUserPreferences(prefs)
      }

      setIsLoading(false)
    }

    fetchUserAndPreferences()
  }, [supabase, isOpen])

  const handleAddToFavorites = async (page: PageInfo) => {
    if (!userId) return

    try {
      const updatedPrefs = await addToFavorites(userId, page)
      setUserPreferences(updatedPrefs)
      toast({
        title: "Página añadida a favoritos",
        description: `${page.title} ha sido añadida a tus favoritos.`,
      })
    } catch (error) {
      console.error("Error al añadir a favoritos:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir la página a favoritos.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromFavorites = async (pageId: string) => {
    if (!userId) return

    try {
      const updatedPrefs = await removeFromFavorites(userId, pageId)
      setUserPreferences(updatedPrefs)
      toast({
        title: "Página eliminada de favoritos",
        description: "La página ha sido eliminada de tus favoritos.",
      })
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la página de favoritos.",
        variant: "destructive",
      })
    }
  }

  const handleSetMainPage = async (page: PageInfo) => {
    if (!userId) return

    try {
      const updatedPrefs = await addToFavorites(userId, page, true)
      setUserPreferences(updatedPrefs)
      toast({
        title: "Página principal actualizada",
        description: `${page.title} es ahora tu página principal.`,
      })
    } catch (error) {
      console.error("Error al establecer página principal:", error)
      toast({
        title: "Error",
        description: "No se pudo establecer la página principal.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMainPage = async () => {
    if (!userId || !userPreferences?.main_page) return

    try {
      const updatedPrefs = await removeFromFavorites(userId, userPreferences.main_page.id, true)
      setUserPreferences(updatedPrefs)
      toast({
        title: "Página principal eliminada",
        description: "Se ha eliminado tu página principal personalizada.",
      })
    } catch (error) {
      console.error("Error al eliminar página principal:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la página principal.",
        variant: "destructive",
      })
    }
  }

  const isInFavorites = (pageId: string) => {
    return userPreferences?.favorite_pages.some((p) => p.id === pageId) || false
  }

  const isMainPage = (pageId: string) => {
    return userPreferences?.main_page?.id === pageId || false
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          <span>Gestionar favoritos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Gestionar páginas favoritas
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Sección de página principal */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Página principal
              </h3>

              {userPreferences?.main_page ? (
                <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{userPreferences.main_page.title}</p>
                      <p className="text-sm text-muted-foreground">{userPreferences.main_page.path}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveMainPage}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No has seleccionado una página principal personalizada.
                </p>
              )}
            </div>

            {/* Sección de favoritos actuales */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Tus favoritos ({userPreferences?.favorite_pages.length || 0}/3)
              </h3>

              {userPreferences?.favorite_pages && userPreferences.favorite_pages.length > 0 ? (
                <div className="grid gap-3">
                  {userPreferences.favorite_pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/10 p-2 rounded-full">
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-muted-foreground">{page.path}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromFavorites(page.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">No tienes páginas favoritas seleccionadas.</p>
              )}
            </div>

            {/* Sección de páginas disponibles */}
            <div>
              <h3 className="text-lg font-medium mb-3">Páginas disponibles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePages.map((page) => {
                  const isFavorite = isInFavorites(page.id)
                  const isMain = isMainPage(page.id)

                  return (
                    <Card
                      key={page.id}
                      className={cn(
                        "transition-all duration-200",
                        (isFavorite || isMain) && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{page.title}</CardTitle>
                          <div className="flex gap-1">
                            {isMain && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                Principal
                              </Badge>
                            )}
                            {isFavorite && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                              >
                                Favorito
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-xs">{page.path}</CardDescription>
                      </CardHeader>
                      <CardFooter className="pt-2 flex justify-between">
                        <Button
                          variant={isMain ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleSetMainPage(page)}
                          disabled={isMain}
                          className={cn("text-xs", isMain && "border-primary/30 text-primary")}
                        >
                          {isMain ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Principal
                            </>
                          ) : (
                            <>
                              <Home className="h-3 w-3 mr-1" />
                              Hacer principal
                            </>
                          )}
                        </Button>

                        {isFavorite ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveFromFavorites(page.id)}
                            className="text-xs border-yellow-500/30 text-yellow-500"
                          >
                            <StarOff className="h-3 w-3 mr-1" />
                            Quitar favorito
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddToFavorites(page)}
                            disabled={userPreferences?.favorite_pages.length >= 3 && !isFavorite}
                            className="text-xs"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Añadir favorito
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
