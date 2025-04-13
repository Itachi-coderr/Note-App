import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Share2, Clock, Trash2, ExternalLink, Plus, Search, X, Twitter, Facebook, Linkedin, MessageCircleMore } from 'lucide-react';
import axios from 'axios';
import DocumentTemplates from '../components/DocumentTemplates';
import WhatsAppIcon from '../components/WhatsAppIcon';

const DocumentSelection = () => {
  const [notes, setNotes] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notes', {
        withCredentials: true
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (e, note) => {
    e.stopPropagation(); // Prevent event bubbling
    setSelectedNote(note);
    setShowShareModal(true);
  };

  const shareViaSocial = (platform) => {
    const shareUrl = `${window.location.origin}/editor/${selectedNote._id}`;
    const title = encodeURIComponent(selectedNote.title);
    const url = encodeURIComponent(shareUrl);

    const socialUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`
    };

    window.open(socialUrls[platform], '_blank', 'width=600,height=400');
  };

  const copyShareLink = async (note) => {
    const shareUrl = `${window.location.origin}/editor/${note._id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/notes/${noteId}`, {
        withCredentials: true
      });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const filteredNotes = {
    owned: notes.owned.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    shared: notes.shared.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Documents</h1>
          <p className="mt-2 text-gray-600">Create, edit, and manage your documents</p>
        </div>

        {/* Search and New Document */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            New Document
          </button>
        </div>

        {/* Templates Section */}
        <div className="mb-12">
          <DocumentTemplates />
        </div>

        {/* Owned Notes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">My Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.owned.map((note) => (
              <div key={note._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-indigo-600" />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
                      <p className="text-sm text-gray-500">
                        Last modified: {new Date(note.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => navigate(`/editor/${note._id}`)}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={(e) => handleShare(e, note)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={() => deleteNote(note._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Notes */}
        {filteredNotes.shared.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shared with Me</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.shared.map((note) => (
                <div key={note._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
                        <p className="text-sm text-gray-500">
                          Shared by: {note.owner.name || note.owner.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/editor/${note._id}`)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Share Document</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Share Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/editor/${selectedNote._id}`}
                      className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => copyShareLink(selectedNote)}
                      className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Social Sharing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Share via Social Media
                  </label>
                  <div className="flex justify-center space-x-6">
                    <button
                      onClick={() => shareViaSocial('twitter')}
                      className="p-3 bg-[#1DA1F2] text-white rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105"
                      title="Share on Twitter"
                    >
                      <Twitter size={20} />
                    </button>
                    <button
                      onClick={() => shareViaSocial('facebook')}
                      className="p-3 bg-[#4267B2] text-white rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105"
                      title="Share on Facebook"
                    >
                      <Facebook size={20} />
                    </button>
                    <button
                      onClick={() => shareViaSocial('linkedin')}
                      className="p-3 bg-[#0077b5] text-white rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105"
                      title="Share on LinkedIn"
                    >
                      <Linkedin size={20} />
                    </button>
                    <button
                      onClick={() => shareViaSocial('whatsapp')}
                      className="p-3 bg-[#25D366] text-white rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105"
                      title="Share on WhatsApp"
                    >
                      <WhatsAppIcon size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSelection;