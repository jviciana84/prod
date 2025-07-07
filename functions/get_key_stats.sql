CREATE OR REPLACE FUNCTION get_key_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_keys', (SELECT COUNT(*) FROM vehicle_keys),
        'first_keys_in_dealership', (SELECT COUNT(*) FROM vehicle_keys WHERE first_key_status = 'En concesionario'),
        'second_keys_in_dealership', (SELECT COUNT(*) FROM vehicle_keys WHERE second_key_status = 'En concesionario'),
        'card_keys_in_dealership', (SELECT COUNT(*) FROM vehicle_keys WHERE card_key_status = 'En concesionario'),
        'first_keys_assigned', (SELECT COUNT(*) FROM vehicle_keys WHERE first_key_status != 'En concesionario'),
        'second_keys_assigned', (SELECT COUNT(*) FROM vehicle_keys WHERE second_key_status != 'En concesionario'),
        'card_keys_assigned', (SELECT COUNT(*) FROM vehicle_keys WHERE card_key_status != 'En concesionario'),
        'pending_confirmations', (SELECT COUNT(*) FROM key_movements WHERE confirmed = false)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
