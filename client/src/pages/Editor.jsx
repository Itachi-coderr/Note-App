import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Share2,
  MoreVertical,
  Save,
  Lock,
  MessageSquare,
  FileText,
  Users,
  X,
  Download,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircleMore
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import WhatsAppIcon from '../components/WhatsAppIcon';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { debounce } from 'lodash';

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const quillRef = useRef();
  const [activeUsers, setActiveUsers] = useState([]);
  const [isDocumentLocked, setIsDocumentLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();
  const lastCursorPosition = useRef(null);
  const lastContentVersion = useRef(0);

  // Fetch note if editing existing
  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  // Join document room when component mounts
  useEffect(() => {
    if (!socket || !id || !user) return;

    // Join document with user info
    socket.emit('join-document', { 
      documentId: id,
      userId: user._id,
      username: user.name || user.email
    });

    // Set initial active users including current user
    setActiveUsers([{
      userId: user._id,
      username: user.name || user.email
    }]);

    // Listen for other users joining
    socket.on('user-joined', (userData) => {
      console.log('User joined:', userData);
      setActiveUsers(prev => {
        if (prev.some(u => u.userId === userData.userId)) {
          return prev;
        }
        return [...prev, userData];
      });
    });

    // Listen for users leaving
    socket.on('user-left', (userData) => {
      console.log('User left:', userData);
      setActiveUsers(prev => prev.filter(u => u.userId !== userData.userId));
    });

    // Listen for document changes
    socket.on('document-changed', ({ changes, version, userId }) => {
      console.log('Document changed:', { changes, version, userId });
      if (userId !== user._id) {
        setContent(changes.content);
        if (version) {
          lastContentVersion.current = version;
        }
      }
    });

    // Request initial document state
    socket.emit('get-document', { documentId: id });

    // Listen for initial document state
    socket.on('load-document', (documentData) => {
      console.log('Loading document:', documentData);
      if (documentData) {
        setContent(documentData.content || '');
        setTitle(documentData.title || 'Untitled Document');
        if (documentData.version) {
          lastContentVersion.current = documentData.version;
        }
      }
    });

    // Listen for cursor movements
    socket.on('cursor-moved', ({ userId, username, position }) => {
      showRemoteCursor(userId, username, position);
    });

    // Listen for document locking
    socket.on('document-locked', ({ userId, username }) => {
      setIsDocumentLocked(true);
      setLockedBy({ userId, username });
    });

    socket.on('document-unlocked', () => {
      setIsDocumentLocked(false);
      setLockedBy(null);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave-document', { 
          documentId: id,
          userId: user._id,
          username: user.name || user.email
        });
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('document-changed');
        socket.off('load-document');
        socket.off('cursor-moved');
        socket.off('document-locked');
        socket.off('document-unlocked');
      }
    };
  }, [socket, id, user]);

  const fetchNote = async () => {
    try {
      if (!id) {
        setTitle('Untitled Document');
        setContent('');
        return;
      }

      const response = await api.get(`/notes/${id}`);
      if (response.data) {
        setTitle(response.data.title || 'Untitled Document');
        setContent(response.data.content || '');
        lastContentVersion.current = response.data.version || 0;

        // Get shared users
        const sharedResponse = await api.get(`/notes/${id}/shared`);
        if (sharedResponse.data) {
          const sharedUsers = sharedResponse.data.map(user => ({
            userId: user._id,
            username: user.name || user.email
          }));
          setActiveUsers(prev => {
            const currentUser = prev.find(u => u.userId === user._id);
            return [...sharedUsers, ...(currentUser ? [currentUser] : [])];
          });
        }
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      if (error.response?.status === 404 && id) {
        await handleSave();
      }
    }
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => setShowImageUpload(true)
      }
    },
    clipboard: {
      matchVisual: false,
      preserveWhitespace: true
    },
    keyboard: {
      bindings: {
        tab: false,
        'space': {
          key: 32,
          handler: function(range) {
            this.quill.insertText(range.index, ' ');
            return false;
          }
        }
      }
    },
    history: {
      delay: 1000,
      maxStack: 500,
      userOnly: true
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'align',
    'link', 'image'
  ];

  // Define handleSave first
  const handleSave = async () => {
    if (!content || isSaving) return;

    try {
      setIsSaving(true);
      const noteData = {
        title,
        content,
        version: lastContentVersion.current
      };

      let response;
      if (id) {
        response = await api.put(`/notes/${id}`, noteData);
      } else {
        response = await api.post('/notes', noteData);
        // Update URL with new note ID
        navigate(`/editor/${response.data._id}`, { replace: true });
      }

      if (response.data.version) {
        lastContentVersion.current = response.data.version;
      }

      // Show success message
      const message = document.createElement('div');
      message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      message.textContent = 'Document saved successfully';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);

      setIsSaving(false);
    } catch (error) {
      console.error('Error saving note:', error);
      const message = document.createElement('div');
      message.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      message.textContent = error.response?.data?.message || 'Failed to save document. Please try again.';
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
      setIsSaving(false);
    }
  };

  // Define debouncedSave before it's used
  const debouncedSave = useMemo(() => 
    debounce(() => {
      handleSave();
    }, 2000)
  , []);

  // Optimize the change handler with better cursor preservation
  const handleChange = (value, delta, source, editor) => {
    if (source !== 'user') return; // Only handle user changes
    
    setContent(value);
    
    // Store current cursor position
    const selection = editor.getSelection();
    
    // Increment version
    const version = lastContentVersion.current + 1;
    lastContentVersion.current = version;

    // Emit changes with debounce
    emitChanges(value, version, selection);

    // Trigger autosave with existing debounce
    debouncedSave();
  };

  // Optimize emitChanges for cursor preservation
  const emitChanges = useMemo(
    () =>
      debounce((value, version, selection) => {
        if (socket && id) {
          socket.emit('document-change', {
            documentId: id,
            changes: {
              content: value,
              title,
              selection
            },
            version,
            userId: user._id
          });
        }
      }, 300), // Increased debounce time for better stability
    [socket, id, title, user._id]
  );

  // Update document changes listener with cursor preservation
  useEffect(() => {
    if (!socket) return;

    const handleDocumentChange = ({ changes, version, userId }) => {
      if (userId !== user._id) {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          // Store current cursor position
          const currentSelection = editor.getSelection();
          
          // Disable editor events temporarily
          editor.disable();
          
          // Update content
          editor.setContents(editor.clipboard.convert(changes.content), 'silent');
          
          // Re-enable editor
          editor.enable();
          
          // Restore cursor position
          if (currentSelection) {
            editor.setSelection(currentSelection);
          }
          
          // Update version
          if (version) {
            lastContentVersion.current = version;
          }
        }
      }
    };

    socket.on('document-changed', handleDocumentChange);

    return () => {
      socket.off('document-changed', handleDocumentChange);
    };
  }, [socket, user._id]);

  // Cleanup debounced functions
  useEffect(() => {
    return () => {
      emitChanges.cancel();
      debouncedSave.cancel();
    };
  }, [emitChanges, debouncedSave]);

  // Handle cursor movement
  const handleCursorMove = (range) => {
    if (socket && id && range && JSON.stringify(range) !== JSON.stringify(lastCursorPosition.current)) {
      lastCursorPosition.current = range;
      socket.emit('cursor-move', {
        documentId: id,
        position: range
      });
    }
  };

  // Handle document locking
  const toggleLock = () => {
    if (socket && id) {
      if (!isDocumentLocked) {
        socket.emit('lock-document', { documentId: id });
        setIsDocumentLocked(true);
        setLockedBy({ userId: user._id, username: user.name || user.email });
      } else if (lockedBy?.userId === user._id) {
        socket.emit('unlock-document', { documentId: id });
        setIsDocumentLocked(false);
        setLockedBy(null);
      }
    }
  };

  // Show remote cursor with debounce
  const showRemoteCursor = (userId, username, position) => {
    const editor = quillRef.current?.getEditor();
    if (editor && position && userId !== user._id) {
      // Remove existing cursor for this user
      const existingCursor = document.querySelector(`[data-user-id="${userId}"]`);
      existingCursor?.remove();

      // Create new cursor element
      const cursorElement = document.createElement('div');
      cursorElement.className = 'remote-cursor';
      cursorElement.setAttribute('data-user-id', userId);
      cursorElement.innerHTML = `
        <div class="cursor-flag" style="background: ${getRandomColor(userId)}">
          ${username}
        </div>
        <div class="cursor-line" style="background: ${getRandomColor(userId)}"></div>
      `;

      // Position the cursor
      const bounds = editor.getBounds(position.index);
      cursorElement.style.left = `${bounds.left}px`;
      cursorElement.style.top = `${bounds.top}px`;

      // Add cursor to editor
      editor.container.appendChild(cursorElement);

      // Remove cursor after delay
      setTimeout(() => cursorElement.remove(), 3000);
    }
  };

  // Generate random color for user cursors
  const getRandomColor = (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/editor/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareViaSocial = (platform) => {
    const url = encodeURIComponent(`${window.location.origin}/editor/${id}`);
    const title = encodeURIComponent(title);

    const socialUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`
    };

    window.open(socialUrls[platform], '_blank', 'width=600,height=400');
  };

  const handleImageUploadSuccess = (url) => {
    try {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      const index = range ? range.index : 0;
      
      // Insert image
      editor.insertEmbed(index, 'image', url);
      editor.setSelection(index + 1);

      // Get the updated content after image insertion
      const updatedContent = editor.root.innerHTML;
      setContent(updatedContent);

      // Emit changes to other users
      const version = lastContentVersion.current + 1;
      lastContentVersion.current = version;
      
      if (socket && id) {
        socket.emit('document-change', {
          documentId: id,
          changes: {
            content: updatedContent,
            title
          },
          version,
          userId: user._id
        });
      }

      // Save the document with the new image
      debouncedSave();
      
      setShowImageUpload(false);
    } catch (error) {
      console.error('Error inserting image:', error);
      alert('Failed to insert image into the editor');
    }
  };

  const handleImageUploadError = (error) => {
    console.error('Image upload error:', error);
    alert('Failed to upload image: ' + error);
    setShowImageUpload(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center">
              <FileText className="w-10 h-10 text-indigo-600" />
              <div className="ml-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare size={18} className="mr-2" />
                Comments
              </button>

              <button
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={toggleLock}
              >
                <Lock size={18} className="mr-2" />
                {isDocumentLocked ? 'Unlock' : 'Lock'}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center px-4 py-2 ${
                  isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white rounded-lg transition-colors`}
              >
                <Save size={18} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download size={18} className="mr-2" />
                Download
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Share2 size={18} className="mr-2" />
                Share
              </button>

              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Active Users Display */}
            <div className="flex items-center space-x-2 px-4">
              {activeUsers.map(u => (
                <div
                  key={u.userId}
                  className="flex items-center text-sm text-gray-600"
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ background: getRandomColor(u.userId) }}
                  />
                  {u.username}
                </div>
              ))}
            </div>

            {/* Lock Status */}
            {isDocumentLocked && (
              <div className="text-sm text-red-600 flex items-center">
                <Lock className="w-4 h-4 mr-1" />
                Locked by {lockedBy?.username}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Editor Area */}
      <main className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg min-h-[calc(100vh-10rem)]">
          {showImageUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Upload Image</h3>
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ImageUpload
                  onUploadSuccess={handleImageUploadSuccess}
                  onUploadError={handleImageUploadError}
                />
              </div>
            </div>
          )}

          {showShareModal && (
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
                        value={`${window.location.origin}/editor/${id}`}
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <button
                        onClick={copyShareLink}
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

          <div className="p-4">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleChange}
              onChangeSelection={handleCursorMove}
              modules={modules}
              formats={formats}
              placeholder="Start writing..."
              className="h-[calc(100vh-16rem)]"
              readOnly={isDocumentLocked && lockedBy?.userId !== user._id}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Editor;