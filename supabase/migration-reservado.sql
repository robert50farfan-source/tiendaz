-- Migración: agrega el estado "reservado" a los productos.
-- La columna status ya existe (texto, pública); solo se amplía la restricción.
-- No modifica filas: los disponibles y vendidos quedan como están.
-- Es seguro volver a ejecutarla.

alter table products drop constraint if exists products_status_check;
alter table products
  add constraint products_status_check
  check (status in ('disponible', 'reservado', 'vendido'));
