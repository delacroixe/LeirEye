-- Inicialización de base de datos LeirEye
-- Este script se ejecuta automáticamente al crear el contenedor

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comentario informativo
COMMENT ON DATABASE LeirEye IS 'LeirEye - Network Traffic Analyzer Database';
