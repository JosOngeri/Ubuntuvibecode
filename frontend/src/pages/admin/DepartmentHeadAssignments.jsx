import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { departmentHeadAPI } from '../../services/permissions.api';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Building2, Users, Plus, X, Edit2, Shield } from 'lucide-react';
import Modal from '../../components/common/Modal';

// Permission groups for department head
const DEPARTMENT_HEAD_PERMISSIONS = [
  { key: 'view_employees', label: 'View Employees', group: 'HR' },
  { key: 'edit_employees', label: 'Edit Employees', group: 'HR' },
  { key: 'approve_leaves_department', label: 'Approve Leaves', group: 'Leave' },
  { key: 'assess_kpis', label: 'Assess KPIs', group: 'KPI' },
  { key: 'view_department_payroll', label: 'View Department Payroll', group: 'Payroll' },
  { key: 'view_attendance_reports', label: 'View Attendance Reports', group: 'Reports' },
  { key: 'resolve_complaints', label: 'Resolve Complaints', group: 'Communication' },
];

// Mock departments - in real app, fetch from API
const DEPARTMENTS = [
  { id: 'hr', name: 'Human Resources' },
  { id: 'it', name: 'IT' },
  { id: 'finance', name: 'Finance' },
  { id: 'operations', name: 'Operations' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'sales', name: 'Sales' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'front_office', name: 'Front Office' },
];

const DepartmentHeadAssignments = ({ standalone = true }) => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [potentialHeads, setPotentialHeads] = useState([]);
  const [sortField, setSortField] = useState('department');
  const [sortDirection, setSortDirection] = useState('asc');

  const [formData, setFormData] = useState({
    userId: '',
    department: '',
    permissions: ['view_employees', 'approve_leaves_department', 'assess_kpis'],
    notes: '',
  });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await departmentHeadAPI.getAssignments();
      setAssignments(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      const allUsers = res.data || [];
      setUsers(allUsers);

      // Filter potential department heads (managers, supervisors, employees)
      const potential = allUsers.filter(u =>
        ['manager', 'supervisor', 'employee'].includes(u.role)
      );
      setPotentialHeads(potential);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!formData.userId || !formData.department) {
      toast.error('Please select user and department');
      return;
    }

    try {
      if (editingAssignment) {
        await departmentHeadAPI.updateAssignment(editingAssignment.id, formData);
        toast.success('Assignment updated');
      } else {
        await departmentHeadAPI.createAssignment(formData);
        toast.success('Assignment created');
      }

      setShowModal(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save assignment');
    }
  };

  const handleDelete = async assignment => {
    if (!confirm('Are you sure you want to remove this department head assignment?')) return;

    try {
      await departmentHeadAPI.deleteAssignment(assignment.id, 'Removed by admin');
      toast.success('Assignment removed');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      department: '',
      permissions: ['view_employees', 'approve_leaves_department', 'assess_kpis'],
      notes: '',
    });
  };

  const openEditModal = assignment => {
    setEditingAssignment(assignment);
    setFormData({
      userId: assignment.userId,
      department: assignment.department,
      permissions: assignment.permissions || [],
      notes: assignment.notes || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    resetForm();
    setShowModal(true);
  };

  const getUserName = userId => {
    const user = users.find(u => u.id === userId || u._id === userId);
    return user?.username || userId;
  };

  const getDepartmentName = deptId => {
    return DEPARTMENTS.find(d => d.id === deptId)?.name || deptId;
  };

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'user') {
      aVal = getUserName(a.userId);
      bVal = getUserName(b.userId);
    } else if (sortField === 'department') {
      aVal = getDepartmentName(a.departmentId);
      bVal = getDepartmentName(b.departmentId);
    } else {
      aVal = a[sortField] || '';
      bVal = b[sortField] || '';
    }
    const comparison = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const columns = [
    {
      key: 'user',
      label: 'Department Head',
      sortable: true,
      render: (_, row) => getUserName(row.userId),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (_, row) => getDepartmentName(row.departmentId),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {row.permissions?.length || 0} permissions granted
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEditModal(row)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(row)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Department Head Assignments</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Assign department heads with configurable permissions for their departments.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={sortedAssignments}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAssignment(null);
        }}
        title={editingAssignment ? 'Edit Assignment' : 'New Assignment'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
              className="form-select w-full"
              disabled={editingAssignment}
            >
              <option value="">Select department...</option>
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department Head</label>
            <select
              value={formData.userId}
              onChange={e => setFormData({ ...formData, userId: e.target.value })}
              className="form-select w-full"
              disabled={editingAssignment}
            >
              <option value="">Select user...</option>
              {potentialHeads.map(u => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">
              {DEPARTMENT_HEAD_PERMISSIONS.map(perm => (
                <label
                  key={perm.key}
                  className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.key)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          permissions: [...formData.permissions, perm.key],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          permissions: formData.permissions.filter(p => p !== perm.key),
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{perm.label}</span>
                  <span className="text-xs text-slate-500 ml-auto">({perm.group})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea w-full"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="primary" onClick={handleSubmit}>
              {editingAssignment ? 'Update' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
};

export default DepartmentHeadAssignments;
