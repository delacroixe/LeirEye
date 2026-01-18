-- Inicialización de base de datos NetMentor
-- Este script se ejecuta automáticamente al crear el contenedor

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comentario informativo
COMMENT ON DATABASE netmentor IS 'NetMentor - Network Traffic Analyzer Database';
