import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Calendar,
  Settings,
  ChevronRight,
  Building,
  Crown,
  Shield,
  Star,
  Plus,
  Edit,
  Trash2,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { FullPageLoading } from '../../components/common/Loading';
import { DepartmentsEmptyState } from '../../components/common/EmptyState';
import { API_ENDPOINTS } from '../../constants/api';
import { SUCCESS_MESSAGES } from '../../constants/validation';

const DepartmentsList = () => {
  const { user, api } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    head_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const canManageDepartments = user?.roles?.some(role => 
    ['Super Admin', 'Pastor', 'First Elder'].includes(role)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, formData);
        toast.success(SUCCESS_MESSAGES.DEPARTMENT_UPDATED);
      } else {
        await api.post('/departments', formData);
        toast.success(SUCCESS_MESSAGES.DEPARTMENT_CREATED);
      }
      setFormData({ name: '', description: '', head_id: '', is_active: true });
      setShowCreateForm(false);
      setEditingDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error('Failed to save department:', error);
      toast.error(editingDepartment ? 'Failed to update department' : 'Failed to create department');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      head_id: department.head_id || '',
      is_active: department.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (departmentId) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/departments/${departmentId}`);
      setDepartments(departments.filter(dept => dept.id !== departmentId));
      toast.success(SUCCESS_MESSAGES.DEPARTMENT_DELETED);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleToggleStatus = async (departmentId, currentStatus) => {
    try {
      await api.put(`/departments/${departmentId}`, { is_active: !currentStatus });
      setDepartments(departments.map(dept =>
        dept.id === departmentId ? { ...dept, is_active: !currentStatus } : dept
      ));
      toast.success(!currentStatus ? 'Department activated' : 'Department deactivated');
    } catch (error) {
      console.error('Error toggling department status:', error);
      toast.error('Failed to update department status');
    }
  };

  const fetchUserDepartments = async () => {
    try {
      const response = await fetch('/api/department/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Leader': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'Assistant': return <Star className="w-4 h-4 text-blue-600" />;
      case 'Secretary': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Leadership': return 'bg-purple-100 text-purple-800';
      case 'Ministry': return 'bg-blue-100 text-blue-800';
      case 'Education': return 'bg-green-100 text-green-800';
      case 'Youth': return 'bg-orange-100 text-orange-800';
      case 'Support': return 'bg-gray-100 text-gray-800';
      case 'Special': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDepartments = departments.filter(dept => {
    if (filter === 'all') return true;
    if (filter === 'leadership') return dept.can_manage;
    if (filter === 'member') return !dept.can_manage;
    return dept.category === filter;
  });

  const groupedDepartments = filteredDepartments.reduce((groups, dept) => {
    const category = dept.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(dept);
    return groups;
  }, {});

  if (loading) {
    return <FullPageLoading message="Loading departments..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-sm text-gray-500">Manage church departments and their activities</p>
        </div>
        {canManageDepartments && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Department
          </button>
        )}
      </div>

      {/* Create/Edit Department Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingDepartment ? 'Edit Department' : 'Create New Department'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Head
                </label>
                <select
                  value={formData.head_id}
                  onChange={(e) => setFormData({...formData, head_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department Head</option>
                  {/* This would be populated with users */}
                  <option value="1">Pastor John</option>
                  <option value="2">First Elder</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Department is active
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingDepartment ? 'Update Department' : 'Create Department'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingDepartment(null);
                  setFormData({ name: '', description: '', head_id: '', is_active: true });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'leadership', 'Leadership', 'Ministry', 'Education', 'Youth', 'Support', 'Special'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption === 'all' ? 'All' : filterOption === 'leadership' ? 'Leadership Roles' : filterOption}
          </button>
        ))}
      </div>

      {/* Department Groups */}
      <div className="space-y-8">
        {filteredDepartments.length > 0 ? (
          Object.entries(groupedDepartments).map(([category, categoryDepartments]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryDepartments.map((department) => (
                <div
                  key={department.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${department.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Building className={`w-6 h-6 ${department.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{department.name}</h3>
                          <p className="text-sm text-gray-500">{department.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {department.is_active ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(department.category || 'Other')}`}>
                        {department.category || 'Other'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {department.head_name || 'No Head'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{department.member_count || 0} Members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>Messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Meetings</span>
                        </div>
                      </div>
                    </div>

                    {!canManageDepartments && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/departments/${department.id}`)}
                          className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Open department hub
                        </button>
                      </div>
                    )}

                    {/* Management Actions */}
                    {canManageDepartments && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => navigate(`/dashboard/departments/${department.id}`)}
                          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Settings className="w-3 h-3" />
                          Manage
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(department)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Department"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(department.id, department.is_active)}
                            className={`p-1 rounded transition-colors ${
                              department.is_active 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={department.is_active ? 'Deactivate Department' : 'Activate Department'}
                          >
                            {department.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(department.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
        ) : (
          <DepartmentsEmptyState />
        )}
      </div>
    </div>
  )
}

export default DepartmentsList;
