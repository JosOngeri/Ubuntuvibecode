import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { userAPI } from '../../services/api';
import { permissionsAPI } from '../../services/permissions.api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { downloadPdfReport } from '../../utils/reportExport';
import {
  PERMISSION_GROUPS,
  DURATION_TYPES,
  DEFAULT_DURATION,
  DURATION_LIMITS,
  formatPermissionLabel,
} from '../../lib/permissions';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, ChevronRight, Clock, Shield, User, Users } from 'lucide-react';

const Permissions = ({ standalone = true }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Existing state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('employee');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');

  // New state for Role vs User permissions
  const [activeTab, setActiveTab] = useState('user'); // 'role' or 'user'
  const [selectedRole, setSelectedRole] = useState('employee');
  const [selectedUser, setSelectedUser] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState(null);
  const [activeOverrides, setActiveOverrides] = useState([]);

  // Permission grant form state
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [durationType, setDurationType] = useState(DURATION_TYPES.DAYS);
  const [durationQuantity, setDurationQuantity] = useState(DEFAULT_DURATION[DURATION_TYPES.DAYS]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [grantLoading, setGrantLoading] = useState(false);

  // Check if user can edit role permissions (admin only)
  const canEditRolePermissions = currentUser?.role === 'admin';

  // Check if user can use permanent duration
  const canUsePermanent = currentUser?.role === 'admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      setUsers(res.data || []);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async role => {
    try {
      const res = await permissionsAPI.getRolePermissions(role);
      setRolePermissions(res.data?.data?.permissions || []);
    } catch (error) {
      toast.error('Failed to fetch role permissions');
    }
  };

  const fetchUserPermissions = async userId => {
    try {
      const res = await permissionsAPI.getUserPermissions(userId);
      setUserPermissions(res.data?.data);
      setActiveOverrides(res.data?.data?.overrides || []);
    } catch (error) {
      toast.error('Failed to fetch user permissions');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'role' && selectedRole) {
      fetchRolePermissions(selectedRole);
    }
  }, [activeTab, selectedRole]);

  useEffect(() => {
    if (activeTab === 'user' && selectedUser) {
      fetchUserPermissions(selectedUser.id);
    }
  }, [activeTab, selectedUser]);

  const toggleGroup = groupKey => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handlePermissionToggle = permissionKey => {
    setSelectedPermissions(prev =>
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleGrantPermissions = async () => {
    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    if (!selectedUser && activeTab === 'user') {
      toast.error('Please select a user');
      return;
    }

    setGrantLoading(true);
    try {
      for (const permissionKey of selectedPermissions) {
        await permissionsAPI.grantPermission({
          userId: activeTab === 'user' ? selectedUser.id : null,
          permissionKey,
          durationType,
          quantity: durationQuantity,
          isGranted: true,
        });
      }

      toast.success(`Granted ${selectedPermissions.length} permission(s)`);
      setSelectedPermissions([]);

      // Refresh permissions
      if (activeTab === 'user' && selectedUser) {
        fetchUserPermissions(selectedUser.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to grant permissions');
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokePermission = async overrideId => {
    try {
      await permissionsAPI.revokePermission(overrideId, 'Manual revocation via permissions page');
      toast.success('Permission revoked');
      if (selectedUser) {
        fetchUserPermissions(selectedUser.id);
      }
    } catch (error) {
      toast.error('Failed to revoke permission');
    }
  };

  const handleRoleChange = async user => {
    try {
      await userAPI.assignRole(user._id || user.id, newRole);
      toast.success('Role updated');
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={e => {
              e.preventDefault();
              const userId = row._id || row.id || row.user_id || row.userId;
              if (!userId) {
                toast.error('User ID is missing');
                return;
              }
              navigate(`/admin/users/${userId}`);
            }}
          >
            View Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingUser(row);
              setNewRole(row.role);
            }}
          >
            Change Role
          </Button>
        </div>
      ),
    },
  ];

  const filteredUsers = users
    .filter(row => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        (row.username || '').toLowerCase().includes(normalizedSearch) ||
        (row.email || '').toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === 'all' || (row.role || '').toLowerCase() === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      const comparison = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportRolesReport = async () => {
    await downloadPdfReport({
      fileName: 'roles-permissions-report.pdf',
      title: 'Roles and Permissions Report',
      rows: filteredUsers,
      columns: [
        { label: 'Username', getValue: row => row.username || '' },
        { label: 'Email', getValue: row => row.email || '' },
        { label: 'Role', getValue: row => row.role || '' },
        { label: 'Status', getValue: row => row.status || '' },
      ],
      metadata: [{ label: 'Role Filter', value: roleFilter === 'all' ? 'All' : roleFilter }],
    });
  };

  const formatDurationLabel = (type, quantity) => {
    if (type === DURATION_TYPES.PERMANENT) return 'Permanent';
    return `${quantity} ${type}`;
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Permission Management</h2>
      </div>

      {/* Tab Toggle: Role Permissions vs User Permissions */}
      <Card>
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {canEditRolePermissions && (
            <button
              onClick={() => setActiveTab('role')}
              className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors ${
                activeTab === 'role'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              Role Permissions
            </button>
          )}
          <button
            onClick={() => setActiveTab('user')}
            className={`px-6 py-3 flex items-center gap-2 font-medium transition-colors ${
              activeTab === 'user'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            User Permissions
          </button>
        </div>

        <div className="p-6">
          {/* Role Selection (for Role tab) */}
          {activeTab === 'role' && canEditRolePermissions && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="form-select w-full max-w-xs"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="department_head">Department Head</option>
                <option value="supervisor">Supervisor</option>
                <option value="employee">Employee</option>
                <option value="daily_labourer">Daily Labourer</option>
                <option value="contractor">Contractor</option>
              </select>
              <p className="text-sm text-slate-500 mt-2">
                Editing default permissions for all users with the <strong>{selectedRole}</strong>{' '}
                role.
              </p>
            </div>
          )}

          {/* User Selection (for User tab) */}
          {activeTab === 'user' && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select User</label>
              <select
                value={selectedUser?.id || ''}
                onChange={e => {
                  const user = users.find(u => u.id === e.target.value || u._id === e.target.value);
                  setSelectedUser(user);
                }}
                className="form-select w-full max-w-md"
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              {selectedUser && (
                <p className="text-sm text-slate-500 mt-2">
                  Current role: <strong>{selectedUser.role}</strong>
                </p>
              )}
            </div>
          )}

          {/* Active Overrides Display (User tab only) */}
          {activeTab === 'user' && selectedUser && activeOverrides.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active Temporary Permissions
              </h4>
              <div className="space-y-2">
                {activeOverrides.map(override => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border"
                  >
                    <div>
                      <span className="font-medium">
                        {formatPermissionLabel(override.permissionKey)}
                      </span>
                      <span className="text-sm text-slate-500 ml-2">
                        ({formatDurationLabel(override.durationType, override.quantity)})
                      </span>
                      {override.expiresAt && (
                        <span className="text-xs text-amber-600 ml-2">
                          Expires: {new Date(override.expiresAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokePermission(override.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permission Groups Checklist */}
          <div className="space-y-4">
            <h4 className="font-medium">Permission Groups</h4>
            {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium">{group.label}</span>
                  {expandedGroups[groupKey] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {expandedGroups[groupKey] && (
                  <div className="p-4 space-y-2">
                    {Object.entries(group.permissions).map(([permKey, permValue]) => {
                      const isGranted =
                        activeTab === 'role'
                          ? rolePermissions.includes(permValue)
                          : userPermissions?.effectivePermissions?.includes(permValue) ||
                            userPermissions?.rolePermissions?.includes(permValue);
                      const isSelected = selectedPermissions.includes(permValue);

                      return (
                        <label
                          key={permKey}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePermissionToggle(permValue)}
                            className="w-4 h-4"
                          />
                          <span className={isGranted ? 'text-green-600 font-medium' : ''}>
                            {formatPermissionLabel(permValue)}
                          </span>
                          {isGranted && <span className="text-xs text-green-500">(Granted)</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Duration Selection */}
          {selectedPermissions.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium mb-4">Permission Duration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration Type</label>
                  <select
                    value={durationType}
                    onChange={e => {
                      setDurationType(e.target.value);
                      setDurationQuantity(DEFAULT_DURATION[e.target.value] || 1);
                    }}
                    className="form-select w-full"
                  >
                    {canUsePermanent && <option value={DURATION_TYPES.PERMANENT}>Permanent</option>}
                    <option value={DURATION_TYPES.DAYS}>Days</option>
                    <option value={DURATION_TYPES.HOURS}>Hours</option>
                    <option value={DURATION_TYPES.MINUTES}>Minutes</option>
                  </select>
                </div>
                {durationType !== DURATION_TYPES.PERMANENT && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min={DURATION_LIMITS[durationType]?.min || 1}
                      max={DURATION_LIMITS[durationType]?.max || 365}
                      value={durationQuantity}
                      onChange={e => setDurationQuantity(parseInt(e.target.value) || 1)}
                      className="form-input w-full"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button
                  onClick={handleGrantPermissions}
                  loading={grantLoading}
                  disabled={grantLoading}
                >
                  Grant {selectedPermissions.length} Permission(s)
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* User List Card */}
      <Card>
        <h3 className="text-lg font-bold mb-4">User List</h3>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Input
            label="Search"
            placeholder="Search by username or email"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="min-w-[240px]"
          />
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select
              className="form-select"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleExportRolesReport}>
            Export Report
          </Button>
        </div>
        <Table
          columns={columns}
          data={filteredUsers}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </Card>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Change Role for {editingUser.username}</h3>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="form-select w-full mb-4"
            >
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => handleRoleChange(editingUser)}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return standalone ? <DashboardLayout>{content}</DashboardLayout> : content;
};

export default Permissions;
