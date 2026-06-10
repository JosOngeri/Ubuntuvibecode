import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { BsUpload, BsFileEarmark, BsTrash } from 'react-icons/bs';
import Button from '../../../components/common/Button';
import { onboardingAPI } from '../services/onboarding.api';

const DOCUMENT_TYPES = [
  { value: 'contract', label: 'Employment Contract', required: true },
  { value: 'nda', label: 'Non-Disclosure Agreement', required: true },
  { value: 'tax_form', label: 'Tax Form (P9/KRA)', required: true },
  { value: 'id_copy', label: 'ID Copy', required: true },
  { value: 'cv', label: 'CV/Resume', required: false },
  { value: 'certificates', label: 'Academic Certificates', required: false },
  { value: 'other', label: 'Other Document', required: false },
];

export default function Step6DocumentUpload({ initialData, applicationId, onSubmit, saving }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [applicationId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await onboardingAPI.getApplicationDocuments(applicationId);
      setDocuments(res.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = e => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedType) {
      toast.error('Please select a file and document type');
      return;
    }

    try {
      setUploading(true);
      // In a real implementation, you would upload the file to a storage service
      // For now, we'll use a mock URL
      const fileUrl = `/uploads/${Date.now()}_${file.name}`;
      
      await onboardingAPI.uploadDocument({
        applicationId,
        documentType: selectedType,
        documentName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        notes,
      });

      toast.success('Document uploaded successfully');
      setFile(null);
      setSelectedType('');
      setNotes('');
      loadDocuments();
    } catch (err) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async documentId => {
    try {
      await onboardingAPI.deleteDocument(documentId);
      toast.success('Document deleted');
      loadDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleSubmit = () => {
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
    const missingDocs = requiredDocs.filter(
      req => !documents.some(doc => doc.document_type === req.value)
    );

    if (missingDocs.length > 0) {
      toast.error(`Please upload required documents: ${missingDocs.map(d => d.label).join(', ')}`);
      return;
    }

    onSubmit({ documents });
  };

  const getRequiredStatus = type => {
    const docType = DOCUMENT_TYPES.find(d => d.value === type);
    return docType?.required ? 'Required' : 'Optional';
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Upload Required Documents
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Please upload all required documents to complete the onboarding process.
        </p>
      </div>

      {/* Upload Form */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Document Type *
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">Select document type</option>
              {DOCUMENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.required ? 'Required' : 'Optional'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              File *
            </label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Add any notes about this document..."
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !selectedType}
            loading={uploading}
          >
            <BsUpload className="mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div>
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-3">
          Uploaded Documents ({documents.length})
        </h4>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
            No documents uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <BsFileEarmark className="text-slate-500 text-xl" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {doc.document_name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label} •{' '}
                      {getRequiredStatus(doc.document_type)}
                    </div>
                    {doc.notes && (
                      <div className="text-xs text-slate-500 mt-1">{doc.notes}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <BsTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Required Documents Checklist */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-3">
          Required Documents Status
        </h4>
        <div className="space-y-2">
          {DOCUMENT_TYPES.filter(d => d.required).map(type => {
            const uploaded = documents.some(doc => doc.document_type === type.value);
            return (
              <div key={type.value} className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center ${
                    uploaded
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {uploaded && '✓'}
                </div>
                <span
                  className={`text-sm ${
                    uploaded
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSubmit} disabled={saving} loading={saving}>
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
