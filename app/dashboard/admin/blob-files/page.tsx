"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { listBlobFiles, deleteFromBlob } from "@/lib/blob/index";

async function fetchBlobs() {
  const res = await fetch("/api/blob/list");
  if (!res.ok) throw new Error("Error al listar archivos: " + (await res.text()));
  const { blobs } = await res.json();
  return blobs;
}

async function deleteBlob(pathname: string) {
  const res = await fetch("/api/blob/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname }),
  });
  if (!res.ok) throw new Error("Error al borrar archivo: " + (await res.text()));
  return true;
}

export default function BlobFilesAdminPage() {
  const [blobs, setBlobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadBlobs();
  }, []);

  async function loadBlobs() {
    setLoading(true);
    try {
      const data = await fetchBlobs();
      setBlobs(data);
    } catch (e: any) {
      toast.error("Error al cargar archivos: " + (e.message || e.error_description || e.error || e.toString()));
      setBlobs([]);
    }
    setLoading(false);
  }

  async function handleDelete(path: string) {
    setDeleting(path);
    try {
      await deleteBlob(path);
      toast.success("Archivo eliminado correctamente");
      setBlobs((prev) => prev.filter((b) => b.pathname !== path));
    } catch (e: any) {
      toast.error("Error al eliminar el archivo: " + (e.message || e.error_description || e.error || e.toString()));
    }
    setDeleting(null);
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Gestión de archivos Blob</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando archivos...</div>
        ) : blobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No hay archivos blob.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Nombre</th>
                  <th className="text-left py-2 px-2">Tamaño</th>
                  <th className="text-left py-2 px-2">Fecha</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {blobs.map((blob) => (
                  <tr key={blob.pathname} className="border-b hover:bg-muted/30">
                    <td className="py-2 px-2 font-mono">{blob.pathname}</td>
                    <td className="py-2 px-2">{blob.size ? (blob.size / 1024).toFixed(1) + " KB" : "-"}</td>
                    <td className="py-2 px-2">{blob.uploadedAt ? new Date(blob.uploadedAt).toLocaleString() : "-"}</td>
                    <td className="py-2 px-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleting === blob.pathname}
                        onClick={() => handleDelete(blob.pathname)}
                      >
                        {deleting === blob.pathname ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 