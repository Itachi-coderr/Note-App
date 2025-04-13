import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FileSpreadsheet, FileCode, FileCheck, FileImage, FileVideo } from 'lucide-react';

const templates = [
  {
    id: 'blank',
    title: 'Blank Document',
    description: 'Start with a clean slate',
    icon: <FileText className="w-8 h-8 text-indigo-600" />,
    category: 'general'
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Template for meeting minutes',
    icon: <FileText className="w-8 h-8 text-blue-600" />,
    category: 'general'
  },
  {
    id: 'project-plan',
    title: 'Project Plan',
    description: 'Template for project planning',
    icon: <FileSpreadsheet className="w-8 h-8 text-green-600" />,
    category: 'general'
  },
  {
    id: 'resume',
    title: 'Professional Resume',
    description: 'Modern resume template',
    icon: <FileCheck className="w-8 h-8 text-purple-600" />,
    category: 'cv'
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    description: 'Showcase your work',
    icon: <FileImage className="w-8 h-8 text-pink-600" />,
    category: 'cv'
  },
  {
    id: 'cover-letter',
    title: 'Cover Letter',
    description: 'Professional cover letter',
    icon: <FileText className="w-8 h-8 text-orange-600" />,
    category: 'cv'
  }
];

const DocumentTemplates = ({ onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = (templateId) => {
    if (onSelect) {
      onSelect(templateId);
    } else {
      navigate(`/editor?template=${templateId}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Templates</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              selectedCategory === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory('general')}
            className={`px-3 py-1 rounded-md text-sm ${
              selectedCategory === 'general'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setSelectedCategory('cv')}
            className={`px-3 py-1 rounded-md text-sm ${
              selectedCategory === 'cv'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            CV/Resume
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gray-50 rounded-full">
                {template.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentTemplates; 