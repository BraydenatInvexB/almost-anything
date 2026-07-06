-- Expand seller document types for full KYC verification

UPDATE seller_documents SET doc_type = 'company_registration' WHERE doc_type = 'registration';
UPDATE seller_documents SET doc_type = 'vat_certificate' WHERE doc_type = 'vat';
UPDATE seller_documents SET doc_type = 'bank_confirmation' WHERE doc_type = 'bank';
UPDATE seller_documents SET doc_type = 'owner_id' WHERE doc_type = 'id';

ALTER TABLE seller_documents DROP CONSTRAINT IF EXISTS seller_documents_doc_type_check;

ALTER TABLE seller_documents ADD CONSTRAINT seller_documents_doc_type_check
  CHECK (doc_type IN (
    'owner_id',
    'proof_of_address',
    'company_registration',
    'vat_certificate',
    'bank_confirmation',
    'partnership_agreement',
    'trust_deed',
    'npo_registration',
    'other'
  ));
