"""Simula a un agente usando el entorno REA por MCP: lista herramientas,
lee las carpetas y prueba una escritura. Muestra qué responde cada una.

Uso:  python agente_demo.py <mcp_url>
"""
import asyncio
import json
import sys

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


def cuerpo(result):
    if result.structuredContent is not None:
        return result.structuredContent
    texto = "".join(getattr(p, "text", "") for p in result.content)
    return json.loads(texto) if texto else {}


async def main(url):
    async with streamable_http_client(url) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = (await session.list_tools()).tools
            print("Herramientas servidas:")
            for t in tools:
                print(f"  - {t.name}: {t.description or ''}".rstrip())

            print("\n[lectura] get_folders:")
            r = await session.call_tool("get_folders", {})
            d = cuerpo(r)
            folders = (d.get("body") or d).get("folders") if isinstance(d, dict) else None
            print("  status", d.get("status"), "->", json.dumps(folders, ensure_ascii=False))

            nombres = {t.name for t in tools}
            if "post_folders" in nombres:
                print("\n[escritura confirmada] post_folders (crear 'Nómina'):")
                r = await session.call_tool("post_folders", {"body": {"nombre": "Nómina"}})
                print("  isError:", r.isError, "->", json.dumps(cuerpo(r), ensure_ascii=False)[:200])


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
