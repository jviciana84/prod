"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Crown, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { availablePages, addToFavorites, removeFromFavorites, getUserPreferences } from "@/lib/user-preferences"
import type { PageInfo, UserPreferences } from "@/types/user-preferences"
import { toast } from "@/hooks/use-toast"

export function FavoritesSettings() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  // Obtener el ID del usuario actual y sus preferencias
  useEffect(() => {
    const fetchUserAndPreferences = async () => {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUserId(session.user.id)
        try {
          const prefs = await getUserPreferences(session.user.id)
          setUserPreferences(prefs)
        } catch (error) {
          console.error("Error al cargar preferencias:", error)
        }
      }

      setIsLoading(false)
    }

    fetchUserAndPreferences()
  }, [])

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Páginas Favoritas</CardTitle>
          <CardDescription>Personaliza tus páginas favoritas y tu página principal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Páginas Favoritas</CardTitle>
        <CardDescription>
          Personaliza tus páginas favoritas y tu página principal. La página principal es a la que serás redirigido
          después de iniciar sesión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todas las páginas</TabsTrigger>
            <TabsTrigger value="main">
              Página principal{" "}
              {userPreferences?.main_page && (
                <Badge variant="secondary" className="ml-2 bg-blue-500/10 text-blue-500">
                  1
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Favoritos{" "}
              {userPreferences?.favorite_pages.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-yellow-500/10 text-yellow-500">
                  {userPreferences.favorite_pages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePages.map((page) => {
                const isFavorite = isInFavorites(page.id)
                const isMain = isMainPage(page.id)

                return (
                  <div
                    key={page.id}
                    className={cn(
                      "border rounded-lg p-4 transition-all",
                      isMain && "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30",
                      isFavorite &&
                        !isMain &&
                        "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30",
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{page.title}</h3>
                      <div className="flex gap-1">
                        {isMain && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          >
                            <Crown className="h-3 w-3 mr-1 text-blue-500" />
                            Principal
                          </Badge>
                        )}
                        {isFavorite && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                          >
                            <Star className="h-3 w-3 mr-1 text-yellow-500" />
                            Favorito
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{page.path}</p>
                    <div className="flex justify-between">
                      <Button
                        variant={isMain ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => handleSetMainPage(page)}
                        disabled={isMain}
                        className={cn(
                          "text-xs",
                          isMain &&
                            "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30",
                        )}
                      >
                        {isMain ? (
                          <>
                            <Check className="h-3 w-3 mr-1 text-blue-500" />
                            Principal
                          </>
                        ) : (
                          <>
                            <Crown className="h-3 w-3 mr-1 text-blue-500" />
                            Hacer principal
                          </>
                        )}
                      </Button>

                      {isFavorite ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromFavorites(page.id)}
                          className="text-xs border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30"
                        >
                          <X className="h-3 w-3 mr-1 text-yellow-500" />
                          Quitar favorito
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddToFavorites(page)}
                          disabled={userPreferences?.favorite_pages.length >= 4 && !isFavorite}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1 text-yellow-500" />
                          Añadir favorito
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="main" className="space-y-4">
            {userPreferences?.main_page ? (
              <div className="border rounded-lg p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">{userPreferences.main_page.title}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                  >
                    Principal
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{userPreferences.main_page.path}</p>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveMainPage}
                    className="text-xs border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30"
                  >
                    <X className="h-3 w-3 mr-1 text-red-500" />
                    Quitar página principal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Crown className="h-12 w-12 text-blue-500 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No has seleccionado una página principal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  La página principal es a la que serás redirigido después de iniciar sesión.
                </p>
                <Button variant="outline" onClick={() => document.querySelector('[data-value="all"]')?.click()}>
                  Seleccionar página principal
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            {userPreferences?.favorite_pages && userPreferences.favorite_pages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPreferences.favorite_pages.map((page) => (
                  <div
                    key={page.id}
                    className="border rounded-lg p-4 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-medium">{page.title}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                      >
                        Favorito
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{page.path}</p>
                    <div className="flex justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetMainPage(page)}
                        disabled={isMainPage(page.id)}
                        className="text-xs"
                      >
                        <Crown className="h-3 w-3 mr-1 text-blue-500" />
                        Hacer principal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFromFavorites(page.id)}
                        className="text-xs border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30"
                      >
                        <X className="h-3 w-3 mr-1 text-red-500" />
                        Quitar favorito
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium mb-2">No tienes páginas favoritas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Añade hasta 4 páginas favoritas para acceder rápidamente a ellas.
                </p>
                <Button variant="outline" onClick={() => document.querySelector('[data-value="all"]')?.click()}>
                  Añadir favoritos
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
