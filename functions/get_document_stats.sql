CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_documents', (SELECT COUNT(*) FROM vehicle_documents),
        'documents_in_dealership', (SELECT COUNT(*) FROM vehicle_documents WHERE technical_sheet_status = 'En concesionario'),
        'documents_assigned', (SELECT COUNT(*) FROM vehicle_documents WHERE technical_sheet_status != 'En concesionario'),
        'pending_confirmations', (SELECT COUNT(*) FROM document_movements WHERE confirmed = false)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
