# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['cvo_scraper_gui.py'],
    pathex=[],
    binaries=[],
    datas=[('cvo-logo.ico', '.')],
    hiddenimports=['tkinter', 'selenium', 'requests', 'urllib', 'zipfile', 'tempfile', 'threading', 'subprocess', 'json', 'datetime', 'time', 'os', 'sys'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='CVO_Scraper',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['cvo-logo.ico'],
)
