import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { supervisorAPI } from '../../services/permissions.api';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Calendar, Users, Plus, X, Edit2 } from 'lucide-react';
import Modal from '../../components/common/Modal';

const ALLOCATION_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary (Date Range)' },
  { value: 'ad_hoc', label: 'Ad-hoc (Single Day)' },
  { value: 'undefined', label: 'Undefined (No End Date)' }
];

const SUPERVISOR_PERMISSIONS = [
  { key: 'attendance_clock', label: 'Clock In/Out for Supervisees' },
  { key: 'kpi_assess', label: 'Assess KPIs' },
  { key: 'leave_approve', label: 'Approve Leaves' }
];

const SupervisorAllocations = ({ standalone = true }) => {
  const [allocations, setAllocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisees, setSupervisees] = useState([]);
  const [sortField, setSortField] = useState('supervisorName');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const [formData, setFormData] = useState({
    supervisorId: '',
    superviseeId: '',
    type: 'temporary',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    permissions: ['attendance_clock'],
    notes: ''
  });

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await supervisorAPI.getAllocations();
      setAllocations(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch allocations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAll();
      const allUsers = res.data || [];
      setUsers(allUsers);
      
      // Filter potential supervisors (managers, department heads, employees)
      const potentialSupervisors = allUsers.filter(u => 
        ['manager', 'department_head', 'supervisor', 'employee'].includes(u.role)
      );
      setSupervisors(potentialSupervisors);
      
      // Filter potential supervisees (employees, daily labourers)
      const potentialSupervisees = allUsers.filter(u => 
        ['employee', 'daily_labourer', 'contractor'].includes(u.role)
      );
      setSupervisees(potentialSupervisees);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchAllocations();
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!formData.supervisorId || !formData.superviseeId) {
      toast.error('Please select supervisor and supervisee');
      return;
    }

    try {
      if (editingAllocation) {
        await supervisorAPI.updateAllocation(editingAllocation.id, formData);
        toast.success('Allocation updated');
      } else {
        await supervisorAPI.createAllocation(formData);
        toast.success('Allocation created');
      }
      
      setShowModal(false);
      setEditingAllocation(null);
      resetForm();
      fetchAllocations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save allocation');
    }
  };

  const handleDelete = async (allocation) => {
    if (!confirm('Are you sure you want to end this allocation?')) return;
    
    try {
      await supervisorAPI.deleteAllocation(allocation.id, 'Ended by admin');
      toast.success('Allocation ended');
      fetchAllocations();
    } catch (error) {
      toast.error('Failed to end allocation');
    }
  };

  const resetForm = () => {
    setFormData({
      supervisorId: '',
      superviseeId: '',
      type: 'temporary',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      permissions: ['attendance_clock'],
      notes: ''
    });
  };

  const openEditModal = (allocation) => {
    setEditingAllocation(allocation);
    setFormData({
      supervisorId: allocation.supervisorId,
      superviseeId: allocation.superviseeId,
      type: allocation.type,
      startDate: allocation.startDate?.split('T')[0] || '',
      endDate: allocation.endDate?.split('T')[0] || '',
      permissions: allocation.permissions || [],
      notes: allocation.notes || ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingAllocation(null);
    resetForm();
    setShowModal(true);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId || u._id === userId);
    return user?.username || userId;
  };

  const getTypeLabel = (type) => {
    return ALLOCATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAllocations = [...allocations].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'supervisor') {
      aVal = getUserName(a.supervisorId);
      bVal = getUserName(b.supervisorId);
    } else if (sortField === 'supervisee') {
      aVal = getUserName(a.superviseeId);
      bVal = getUserName(b.superviseeId);
    } else if (sortField === 'startDate') {
      aVal = a.startDate || '';
      bVal = b.startDate || '';
      const comparison = new Date(aVal) - new Date(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    } else {
      aVal = a[sortField] || '';
      bVal = b[sortField] || '';
    }
    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const columns = [
    { key: 'supervisor', label: 'Supervisor', sortable: true, render: (_, row) => getUserName(row.supervisorId) },
    { key: 'supervisee', label: 'Supervisee', sortable: true, render: (_, row) => getUserName(row.superviseeId) },
    { key: 'type', label: 'Type', sortable: true, render: (_, row) => getTypeLabel(row.type) },
    { 
      key: 'period', 
      label: 'Period', 
      sortable: true,
      render: (_, row) => {
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString() : '-';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString() : 
                    (row.type === 'permanent' || row.type === 'undefined') ? 'No end' : '-';
        return `${start} - ${end}`;
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (_, row) => (
        <span className={`px-2 py-1 rounded text-xs ${
          row.isActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
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
      )
    }
  ];

  const content = (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Supervisor Allocations</h2>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            New Allocation
          </Button>
        </div>

        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Manage supervisor-supervisee relationships. Allocations can be permanent, temporary, ad-hoc, or undefined time.
          </p>
          <Table columns={columns} data={sortedAllocations} loading={loading} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
        </Card>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingAllocation(null);
          }}
          title={editingAllocation ? 'Edit Allocation' : 'New Allocation'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supervisor</label>
              <select
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                className="form-select w-full"
                disabled={editingAllocation}
              >
                <option value="">Select supervisor...</option>
                {supervisors.map(s => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.username} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Supervisee</label>
              <select
                value={formData.superviseeId}
                onChange={(e) => setFormData({ ...formData, superviseeId: e.target.value })}
                className="form-select w-full"
                disabled={editingAllocation}
              >
                <option value="">Select supervisee...</option>
                {supervisees.map(s => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.username} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Allocation Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select w-full"
              >
                {ALLOCATION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="form-input w-full"
                />
              </div>
              {(formData.type === 'temporary' || formData.type === 'ad_hoc') && (
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="form-input w-full"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="space-y-2">
                {SUPERVISOR_PERMISSIONS.map(perm => (
                  <label key={perm.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, permissions: [...formData.permissions, perm.key] });
                        } else {
                          setFormData({ 
                            ...formData, 
                            permissions: formData.permissions.filter(p => p !== perm.key) 
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-textarea w-full"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleSubmit}>
                {editingAllocation ? 'Update' : 'Create'}
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

export default SupervisorAllocations;
