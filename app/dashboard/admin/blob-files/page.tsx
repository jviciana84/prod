"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { listBlobFiles, deleteFromBlob } from "@/lib/blob/index";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PackageOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo } from "react";

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

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function isImageFile(pathname: string) {
  const ext = pathname.split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext || "");
}

export default function BlobFilesAdminPage() {
  const [blobs, setBlobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const totalRows = blobs.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / itemsPerPage));
  const paginatedRows = useMemo(() => blobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [blobs, currentPage, itemsPerPage]);

  function getPageNumbers() {
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let end = start + maxPagesToShow - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

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
    <div className="container py-6 space-y-6">
      <Breadcrumbs items={[
        { label: "Administración", href: "/dashboard/admin" },
        { label: "Archivos Blob", href: "/dashboard/admin/blob-files" },
      ]} />
      <div className="flex items-center gap-3">
        <PackageOpen className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de archivos Blob</h1>
          <p className="text-muted-foreground">Visualiza y elimina archivos subidos al sistema</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">Cargando archivos...</div>
          ) : totalRows === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay archivos blob.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Archivo</th>
                      <th className="text-left py-2 px-2">Nombre</th>
                      <th className="text-left py-2 px-2">Tamaño</th>
                      <th className="text-left py-2 px-2">Fecha</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((blob) => (
                      <tr key={blob.pathname} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-2">
                          {isImageFile(blob.pathname) ? (
                            <img
                              src={blob.url || `https://${blob.pathname}`}
                              alt={blob.pathname}
                              className="w-12 h-12 object-cover rounded shadow border"
                              style={{ maxWidth: 48, maxHeight: 48 }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <FileIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-2 px-2 font-mono break-all max-w-xs">{blob.pathname}</td>
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
              {/* Paginador */}
              <div className="mt-4 rounded-lg border bg-card shadow-sm px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {totalRows === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                  -{Math.min(currentPage * itemsPerPage, totalRows)} de <span className="font-bold">{totalRows}</span> archivos
                </div>
                <div className="flex items-center gap-2">
                  {/* Selector de filas por página */}
                  <div className="flex items-center gap-1 mr-4">
                    <span className="text-xs">Filas por página:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={v => setItemsPerPage(Number(v))}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 50].map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Flechas y números de página */}
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8">{'<<'}</Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8">{'<'}</Button>
                  {getPageNumbers().map((n) => (
                    <Button key={n} variant={n === currentPage ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(n)} className="h-8 w-8 font-bold">{n}</Button>
                  ))}
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8">{'>'}</Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8">{'>>'}</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 