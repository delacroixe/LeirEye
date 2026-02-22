"""
Rutas WebSocket para terminal interactiva
Permite ejecutar comandos shell en el servidor
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional
import asyncio
import logging
import os
import signal
import pty
import select
import termios
import struct
import fcntl

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/terminal", tags=["terminal"])

# Almacenar procesos activos por conexión
active_terminals: dict[str, dict] = {}


class TerminalSession:
    """Maneja una sesión de terminal PTY"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.master_fd: Optional[int] = None
        self.slave_fd: Optional[int] = None
        self.pid: Optional[int] = None
        self.running = False
        
    async def start(self, cols: int = 80, rows: int = 24):
        """Inicia un proceso shell con PTY"""
        try:
            # Crear pseudo-terminal
            self.master_fd, self.slave_fd = pty.openpty()
            
            # Configurar tamaño de terminal
            self.resize(cols, rows)
            
            # Fork del proceso
            self.pid = os.fork()
            
            if self.pid == 0:
                # Proceso hijo - ejecutar shell
                os.close(self.master_fd)
                os.setsid()
                os.dup2(self.slave_fd, 0)  # stdin
                os.dup2(self.slave_fd, 1)  # stdout
                os.dup2(self.slave_fd, 2)  # stderr
                os.close(self.slave_fd)
                
                # Configurar variables de entorno
                env = os.environ.copy()
                env['TERM'] = 'xterm-256color'
                env['COLORTERM'] = 'truecolor'
                
                # Ejecutar shell
                shell = os.environ.get('SHELL', '/bin/bash')
                os.execvpe(shell, [shell, '-l'], env)
            else:
                # Proceso padre
                os.close(self.slave_fd)
                self.running = True
                logger.info(f"Terminal {self.session_id} iniciada con PID {self.pid}")
                
        except Exception as e:
            logger.error(f"Error iniciando terminal: {e}")
            raise
            
    def resize(self, cols: int, rows: int):
        """Redimensiona la terminal"""
        if self.master_fd:
            winsize = struct.pack('HHHH', rows, cols, 0, 0)
            fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, winsize)
            
    def write(self, data: str):
        """Escribe datos a la terminal"""
        if self.master_fd and self.running:
            os.write(self.master_fd, data.encode('utf-8'))
            
    def read(self, timeout: float = 0.1) -> Optional[str]:
        """Lee datos de la terminal"""
        if not self.master_fd or not self.running:
            return None
            
        try:
            ready, _, _ = select.select([self.master_fd], [], [], timeout)
            if ready:
                data = os.read(self.master_fd, 4096)
                return data.decode('utf-8', errors='replace')
        except OSError:
            self.running = False
        return None
        
    def close(self):
        """Cierra la terminal"""
        self.running = False
        if self.master_fd:
            try:
                os.close(self.master_fd)
            except OSError:
                pass
        if self.pid:
            try:
                os.kill(self.pid, signal.SIGTERM)
                os.waitpid(self.pid, os.WNOHANG)
            except OSError:
                pass
        logger.info(f"Terminal {self.session_id} cerrada")


@router.websocket("/ws")
async def terminal_websocket(websocket: WebSocket):
    """WebSocket para terminal interactiva PTY"""
    await websocket.accept()
    session_id = str(id(websocket))
    terminal = TerminalSession(session_id)
    
    try:
        # Esperar configuración inicial
        init_data = await websocket.receive_json()
        cols = init_data.get('cols', 80)
        rows = init_data.get('rows', 24)
        
        # Iniciar terminal
        await terminal.start(cols, rows)
        
        await websocket.send_json({
            "type": "connected",
            "message": "Terminal conectada (PTY mode)"
        })
        
        # Loop principal
        while terminal.running:
            # Leer output de terminal
            output = terminal.read(timeout=0.05)
            if output:
                await websocket.send_json({
                    "type": "output",
                    "data": output
                })
            
            # Verificar input del cliente
            try:
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=0.05
                )
                
                msg_type = data.get("type")
                
                if msg_type == "input":
                    terminal.write(data.get("data", ""))
                elif msg_type == "resize":
                    terminal.resize(
                        data.get("cols", 80),
                        data.get("rows", 24)
                    )
                elif msg_type == "close":
                    break
                    
            except asyncio.TimeoutError:
                continue
                
    except WebSocketDisconnect:
        logger.info(f"Terminal {session_id}: Cliente desconectado")
    except Exception as e:
        logger.error(f"Error en terminal WebSocket: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except Exception:
            pass
    finally:
        terminal.close()


# Endpoint alternativo más simple (sin PTY completo)
@router.websocket("/ws/simple")
async def simple_terminal_websocket(websocket: WebSocket):
    """WebSocket para terminal simple (ejecuta comandos individuales)"""
    await websocket.accept()
    session_id = str(id(websocket))
    current_process: Optional[asyncio.subprocess.Process] = None
    cwd = os.path.expanduser("~")
    
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Terminal conectada",
            "cwd": cwd
        })
        
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "command":
                command = data.get("command", "").strip()
                
                if not command:
                    continue
                    
                # Manejar cd especialmente
                if command.startswith("cd "):
                    new_dir = command[3:].strip()
                    new_dir = os.path.expanduser(new_dir)
                    if not os.path.isabs(new_dir):
                        new_dir = os.path.join(cwd, new_dir)
                    new_dir = os.path.normpath(new_dir)
                    
                    if os.path.isdir(new_dir):
                        cwd = new_dir
                        await websocket.send_json({
                            "type": "output",
                            "data": ""
                        })
                    else:
                        await websocket.send_json({
                            "type": "output",
                            "data": f"cd: no such file or directory: {new_dir}\n"
                        })
                    await websocket.send_json({
                        "type": "prompt",
                        "cwd": cwd
                    })
                    continue
                
                # Ejecutar comando
                try:
                    current_process = await asyncio.create_subprocess_shell(
                        command,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.STDOUT,
                        cwd=cwd,
                        env={**os.environ, 'TERM': 'xterm-256color'}
                    )
                    
                    # Leer output en tiempo real
                    while True:
                        try:
                            line = await asyncio.wait_for(
                                current_process.stdout.readline(),
                                timeout=0.1
                            )
                            if line:
                                await websocket.send_json({
                                    "type": "output",
                                    "data": line.decode('utf-8', errors='replace')
                                })
                            elif current_process.returncode is not None:
                                break
                        except asyncio.TimeoutError:
                            if current_process.returncode is not None:
                                break
                            continue
                    
                    await current_process.wait()
                    
                    # Enviar código de salida
                    await websocket.send_json({
                        "type": "exit",
                        "code": current_process.returncode
                    })
                    
                except Exception as e:
                    await websocket.send_json({
                        "type": "output",
                        "data": f"Error: {str(e)}\n"
                    })
                finally:
                    current_process = None
                    await websocket.send_json({
                        "type": "prompt",
                        "cwd": cwd
                    })
                    
            elif msg_type == "interrupt":
                if current_process:
                    current_process.terminate()
                    await websocket.send_json({
                        "type": "output",
                        "data": "^C\n"
                    })
                    
            elif msg_type == "close":
                break
                
    except WebSocketDisconnect:
        logger.info(f"Terminal simple {session_id}: Cliente desconectado")
    except Exception as e:
        logger.error(f"Error en terminal simple WebSocket: {e}")
    finally:
        if current_process:
            current_process.terminate()
