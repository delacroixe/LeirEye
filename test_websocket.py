#!/usr/bin/env python3
"""
Script para probar la conexión WebSocket y captura de paquetes
Requiere: pip install websockets
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Prueba la conexión WebSocket y recibe paquetes"""
    uri = "ws://localhost:8000/api/capture/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✓ Conectado a {uri}")
            
            # Recibir mensaje de estado inicial
            message = await websocket.recv()
            data = json.loads(message)
            print(f"\n📊 Estado inicial: {data}")
            
            # Iniciar captura (simular comando)
            print("\n🔍 Iniciando captura...")
            await asyncio.sleep(1)
            
            # Escuchar paquetes durante 10 segundos
            packet_count = 0
            start_time = asyncio.get_event_loop().time()
            
            try:
                while True:
                    elapsed = asyncio.get_event_loop().time() - start_time
                    if elapsed > 10:
                        print(f"\n⏱️ Tiempo de prueba alcanzado (10s)")
                        break
                    
                    # Recibir con timeout
                    try:
                        message = await asyncio.wait_for(
                            websocket.recv(),
                            timeout=2.0
                        )
                        data = json.loads(message)
                        
                        if data.get("type") == "packet":
                            packet_count += 1
                            pkt = data.get("data", {})
                            print(f"📦 Paquete {packet_count}: {pkt.get('src_ip')} → {pkt.get('dst_ip')} ({pkt.get('protocol')})")
                        elif data.get("type") == "status":
                            status = data.get("data", {})
                            print(f"📊 Status: {status.get('packets_captured')} paquetes capturados")
                    
                    except asyncio.TimeoutError:
                        print(f"⏳ Esperando paquetes... ({int(elapsed)}s)")
                        continue
            
            except KeyboardInterrupt:
                print("\n⏹️ Prueba detenida por usuario")
            
            print(f"\n✓ Prueba completada: {packet_count} paquetes recibidos")
            
    except ConnectionRefusedError:
        print(f"❌ Error: No se puede conectar a {uri}")
        print("Asegúrate que el backend está corriendo: sudo python run.py")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🧪 Prueba de WebSocket - Network Traffic Analyzer")
    print("=" * 50)
    asyncio.run(test_websocket())
