import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Book, Camera, AlertTriangle } from "lucide-react"

export default function PhotosTabs() {
  return (
    <Tabs defaultValue="images" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="images">
          <Camera className="mr-2 h-4 w-4" />
          Images
        </TabsTrigger>
        <TabsTrigger value="test">
          <Book className="mr-2 h-4 w-4" />
          Test
        </TabsTrigger>
        <TabsTrigger value="premature-sales">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Ventas Prematuras
        </TabsTrigger>
      </TabsList>
      <TabsContent value="images">
        <p>This is the images tab content.</p>
      </TabsContent>
      <TabsContent value="test">
        <p>This is the test tab content.</p>
      </TabsContent>
      <TabsContent value="premature-sales">
        <p>This is the premature sales tab content.</p>
      </TabsContent>
    </Tabs>
  )
}
