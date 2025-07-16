#!/usr/bin/env python3
"""
Aplicación GUI para analizar archivos Excel y generar mapeos de columnas
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import pandas as pd
import json
import os
from pathlib import Path
from datetime import datetime

class ExcelAnalyzerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Scraper - CVO")
        self.root.geometry("1000x700")
        
        # Variables
        self.excel_file = None
        self.df = None
        self.headers = []
        
        self.setup_ui()
        
    def setup_ui(self):
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configurar grid
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(3, weight=1)
        
        # Título
        title_label = ttk.Label(main_frame, text="🔍 Scraper - CVO", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Botón para seleccionar archivo
        ttk.Button(main_frame, text="📁 Seleccionar Archivo Excel", 
                  command=self.select_file).grid(row=1, column=0, pady=(0, 10), sticky=tk.W)
        
        # Label para mostrar archivo seleccionado
        self.file_label = ttk.Label(main_frame, text="Ningún archivo seleccionado", 
                                   foreground="gray")
        self.file_label.grid(row=1, column=1, columnspan=2, pady=(0, 10), sticky=tk.W)
        
        # Botón para analizar
        self.analyze_btn = ttk.Button(main_frame, text="🔍 Analizar Columnas", 
                                     command=self.analyze_file, state="disabled")
        self.analyze_btn.grid(row=2, column=0, pady=(0, 10), sticky=tk.W)
        
        # Botón para exportar
        self.export_btn = ttk.Button(main_frame, text="💾 Exportar Mapeo", 
                                    command=self.export_mapping, state="disabled")
        self.export_btn.grid(row=2, column=1, pady=(0, 10), sticky=tk.W)
        
        # Notebook para pestañas
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Pestaña 1: Resumen
        self.summary_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.summary_frame, text="📊 Resumen")
        
        # Pestaña 2: Columnas
        self.columns_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.columns_frame, text="📋 Columnas")
        
        # Pestaña 3: Mapeo
        self.mapping_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.mapping_frame, text="🎯 Mapeo")
        
        # Pestaña 4: Datos de ejemplo
        self.data_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.data_frame, text="📄 Datos de Ejemplo")
        
        self.setup_summary_tab()
        self.setup_columns_tab()
        self.setup_mapping_tab()
        self.setup_data_tab()
        
    def setup_summary_tab(self):
        # Frame para resumen
        summary_frame = ttk.Frame(self.summary_frame, padding="10")
        summary_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.summary_frame.columnconfigure(0, weight=1)
        self.summary_frame.rowconfigure(0, weight=1)
        summary_frame.columnconfigure(0, weight=1)
        summary_frame.rowconfigure(1, weight=1)
        
        # Título
        ttk.Label(summary_frame, text="📊 Resumen del Archivo", 
                 font=("Arial", 12, "bold")).grid(row=0, column=0, pady=(0, 10), sticky=tk.W)
        
        # Texto de resumen
        self.summary_text = scrolledtext.ScrolledText(summary_frame, height=20, width=80)
        self.summary_text.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
    def setup_columns_tab(self):
        # Frame para columnas
        columns_frame = ttk.Frame(self.columns_frame, padding="10")
        columns_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.columns_frame.columnconfigure(0, weight=1)
        self.columns_frame.rowconfigure(0, weight=1)
        columns_frame.columnconfigure(0, weight=1)
        columns_frame.rowconfigure(1, weight=1)
        
        # Título
        ttk.Label(columns_frame, text="📋 Lista de Columnas", 
                 font=("Arial", 12, "bold")).grid(row=0, column=0, pady=(0, 10), sticky=tk.W)
        
        # Treeview para columnas
        columns_tree = ttk.Treeview(columns_frame, columns=("index", "name", "type", "non_null"), 
                                   show="headings", height=15)
        columns_tree.heading("index", text="#")
        columns_tree.heading("name", text="Nombre de Columna")
        columns_tree.heading("type", text="Tipo de Dato")
        columns_tree.heading("non_null", text="No Nulos")
        
        columns_tree.column("index", width=50)
        columns_tree.column("name", width=300)
        columns_tree.column("type", width=100)
        columns_tree.column("non_null", width=100)
        
        columns_tree.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(columns_frame, orient=tk.VERTICAL, command=columns_tree.yview)
        scrollbar.grid(row=1, column=1, sticky=(tk.N, tk.S))
        columns_tree.configure(yscrollcommand=scrollbar.set)
        
        self.columns_tree = columns_tree
        
    def setup_mapping_tab(self):
        # Frame para mapeo
        mapping_frame = ttk.Frame(self.mapping_frame, padding="10")
        mapping_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.mapping_frame.columnconfigure(0, weight=1)
        self.mapping_frame.rowconfigure(0, weight=1)
        mapping_frame.columnconfigure(1, weight=1)
        mapping_frame.rowconfigure(1, weight=1)
        
        # Título
        ttk.Label(mapping_frame, text="🎯 Mapeo Sugerido", 
                 font=("Arial", 12, "bold")).grid(row=0, column=0, pady=(0, 10), sticky=tk.W)
        
        # Treeview para mapeo
        mapping_tree = ttk.Treeview(mapping_frame, columns=("bd_field", "excel_column", "status"), 
                                   show="headings", height=15)
        mapping_tree.heading("bd_field", text="Campo BD")
        mapping_tree.heading("excel_column", text="Columna Excel")
        mapping_tree.heading("status", text="Estado")
        
        mapping_tree.column("bd_field", width=200)
        mapping_tree.column("excel_column", width=300)
        mapping_tree.column("status", width=100)
        
        mapping_tree.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(mapping_frame, orient=tk.VERTICAL, command=mapping_tree.yview)
        scrollbar.grid(row=1, column=2, sticky=(tk.N, tk.S))
        mapping_tree.configure(yscrollcommand=scrollbar.set)
        
        self.mapping_tree = mapping_tree
        
    def setup_data_tab(self):
        # Frame para datos
        data_frame = ttk.Frame(self.data_frame, padding="10")
        data_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.data_frame.columnconfigure(0, weight=1)
        self.data_frame.rowconfigure(0, weight=1)
        data_frame.columnconfigure(0, weight=1)
        data_frame.rowconfigure(1, weight=1)
        
        # Título
        ttk.Label(data_frame, text="📄 Datos de Ejemplo (Primeras 5 filas)", 
                 font=("Arial", 12, "bold")).grid(row=0, column=0, pady=(0, 10), sticky=tk.W)
        
        # Texto para datos
        self.data_text = scrolledtext.ScrolledText(data_frame, height=20, width=80)
        self.data_text.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
    def select_file(self):
        file_path = filedialog.askopenfilename(
            title="Seleccionar archivo Excel",
            filetypes=[
                ("Archivos Excel", "*.xlsx *.xls"),
                ("Archivos CSV", "*.csv"),
                ("Todos los archivos", "*.*")
            ]
        )
        
        if file_path:
            self.excel_file = file_path
            self.file_label.config(text=f"Archivo: {os.path.basename(file_path)}")
            self.analyze_btn.config(state="normal")
            
    def analyze_file(self):
        if not self.excel_file:
            messagebox.showerror("Error", "Por favor selecciona un archivo primero")
            return
            
        try:
            # Cargar archivo
            if self.excel_file.endswith('.csv'):
                self.df = pd.read_csv(self.excel_file, delimiter=';', encoding='utf-8')
            else:
                self.df = pd.read_excel(self.excel_file)
            
            self.headers = list(self.df.columns)
            
            # Actualizar resumen
            self.update_summary()
            
            # Actualizar columnas
            self.update_columns()
            
            # Actualizar mapeo
            self.update_mapping()
            
            # Actualizar datos de ejemplo
            self.update_data_example()
            
            # Habilitar exportar
            self.export_btn.config(state="normal")
            
            messagebox.showinfo("Éxito", f"Archivo analizado correctamente.\nSe encontraron {len(self.headers)} columnas.")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error al analizar el archivo:\n{str(e)}")
            
    def update_summary(self):
        if self.df is None:
            return
            
        summary = f"""📊 RESUMEN DEL ARCHIVO
{'='*50}

📁 Archivo: {os.path.basename(self.excel_file)}
📅 Fecha de análisis: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📈 ESTADÍSTICAS:
• Total de columnas: {len(self.headers)}
• Total de filas: {len(self.df)}
• Tamaño del archivo: {self.get_file_size()}

📋 TIPOS DE DATOS:
"""
        
        # Contar tipos de datos
        type_counts = self.df.dtypes.value_counts()
        for dtype, count in type_counts.items():
            summary += f"• {dtype}: {count} columnas\n"
            
        summary += f"""

🔍 COLUMNAS CON VALORES NULOS:
"""
        
        # Mostrar columnas con valores nulos
        null_counts = self.df.isnull().sum()
        null_columns = null_counts[null_counts > 0]
        
        if len(null_columns) > 0:
            for col, count in null_columns.items():
                percentage = (count / len(self.df)) * 100
                summary += f"• {col}: {count} valores nulos ({percentage:.1f}%)\n"
        else:
            summary += "• No hay columnas con valores nulos\n"
            
        self.summary_text.delete(1.0, tk.END)
        self.summary_text.insert(1.0, summary)
        
    def update_columns(self):
        # Limpiar treeview
        for item in self.columns_tree.get_children():
            self.columns_tree.delete(item)
            
        # Insertar columnas
        for i, col in enumerate(self.headers):
            dtype = str(self.df[col].dtype)
            non_null = self.df[col].count()
            self.columns_tree.insert("", "end", values=(i, col, dtype, non_null))
            
    def update_mapping(self):
        # Limpiar treeview
        for item in self.mapping_tree.get_children():
            self.mapping_tree.delete(item)
            
        # Mapeo sugerido
        mapeo_sugerido = {
            "license_plate": ["Matrícula", "Matricula", "Plate"],
            "model": ["Modelo", "Model"],
            "brand": ["Marca", "Brand"],
            "chassis": ["Chasis", "Chassis"],
            "color": ["Color", "Color Carrocería"],
            "fuel_type": ["Combustible", "Fuel"],
            "transmission": ["Cambio", "Transmission"],
            "body_type": ["Carrocería", "Body"],
            "engine_power": ["Potencia", "Power"],
            "mileage": ["KM", "Kilometraje", "Mileage"],
            "purchase_price": ["Precio compra", "Purchase Price"],
            "sale_price": ["Precio", "Price"],
            "purchase_date": ["Fecha compra", "Purchase Date"],
            "manufacturing_date": ["Fecha fabricación", "Manufacturing Date"],
            "origin_location": ["Concesionario", "Location"],
            "equipment": ["Equipamiento", "Equipment"],
            "state": ["Estado", "State"],
            "availability": ["Disponibilidad", "Availability"],
            "warranty": ["Garantía", "Warranty"],
            "currency": ["Moneda", "Currency"],
            "observations": ["Observaciones", "Notes"],
            "origin": ["Origen", "Origin"],
            "supplier": ["Proveedor", "Supplier"],
            "url": ["URL", "Link"],
            "version": ["Versión", "Version"]
        }
        
        # Buscar coincidencias
        for campo_bd, posibles_nombres in mapeo_sugerido.items():
            encontrado = False
            columna_encontrada = ""
            
            for nombre in posibles_nombres:
                if nombre in self.headers:
                    encontrado = True
                    columna_encontrada = nombre
                    break
                    
            if encontrado:
                self.mapping_tree.insert("", "end", values=(campo_bd, columna_encontrada, "✅ Encontrada"))
            else:
                self.mapping_tree.insert("", "end", values=(campo_bd, "No encontrada", "❌ No encontrada"))
                
    def update_data_example(self):
        if self.df is None:
            return
            
        # Mostrar primeras 5 filas
        example_data = self.df.head().to_string(index=False)
        self.data_text.delete(1.0, tk.END)
        self.data_text.insert(1.0, example_data)
        
    def get_file_size(self):
        try:
            size = os.path.getsize(self.excel_file)
            if size < 1024:
                return f"{size} bytes"
            elif size < 1024 * 1024:
                return f"{size/1024:.1f} KB"
            else:
                return f"{size/(1024*1024):.1f} MB"
        except:
            return "Desconocido"
            
    def export_mapping(self):
        if not self.headers:
            messagebox.showerror("Error", "No hay datos para exportar")
            return
            
        # Crear mapeo
        mapping_data = {
            "archivo_origen": os.path.basename(self.excel_file),
            "fecha_analisis": datetime.now().isoformat(),
            "total_columnas": len(self.headers),
            "total_filas": len(self.df) if self.df is not None else 0,
            "columnas": self.headers,
            "mapeo_sugerido": {}
        }
        
        # Guardar archivo
        file_path = filedialog.asksaveasfilename(
            title="Guardar mapeo como",
            defaultextension=".json",
            filetypes=[("Archivos JSON", "*.json"), ("Todos los archivos", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(mapping_data, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Éxito", f"Mapeo guardado en:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Error al guardar el archivo:\n{str(e)}")

def main():
    root = tk.Tk()
    app = ExcelAnalyzerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main() 