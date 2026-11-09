"""Corre el verify.py del entorno REA contra un endpoint MCP ya servido.

Uso:  python verificar_entorno.py <carpeta_del_entorno> <mcp_url>
"""
import asyncio
import importlib.util
import sys
from pathlib import Path

bundle = Path(sys.argv[1])
mcp_url = sys.argv[2]
verify_py = next(bundle.glob("artifacts/*/verify.py"))

spec = importlib.util.spec_from_file_location("verify_entorno", verify_py)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

resultado = asyncio.run(mod.verify(mcp_url))
ok = all(r["result"] for r in resultado)
print("VEREDICTO:", "PASA" if ok else "FALLA")
sys.exit(0 if ok else 1)
