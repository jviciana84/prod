SELECT
  concesionario,
  año,
  objetivo_porcentaje,
  created_at,
  updated_at
FROM
  financial_penetration_objectives
WHERE
  año = EXTRACT(YEAR FROM CURRENT_DATE) -- O el año que estés seleccionando en el dashboard
ORDER BY
  concesionario,
  año;
