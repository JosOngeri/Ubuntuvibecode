import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';
import { Briefcase, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const ContractorQuotes = () => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await api.get('/contractors/quotes');
      setQuotes(res.data);
    } catch (err) {
      toast.error('Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Quotes</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          Submit Quote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <div key={quote.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{quote.projectTitle}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                quote.status === 'approved' ? 'bg-green-100 text-green-800' :
                quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {quote.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Description:</strong> {quote.description}</p>
              <p><strong>Amount:</strong> KES {quote.amount?.toLocaleString() || 0}</p>
              <p><strong>Submitted:</strong> {new Date(quote.submittedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {quotes.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-md">
          No quotes found
        </div>
      )}
    </div>
  );
};

export default ContractorQuotes;
