import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import orientationChecklistAPI from '../../services/orientationChecklistAPI';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';
import { TrainingEmptyState } from '../../components/common/EmptyState';
import PageInfoPanel from '../../components/common/PageInfoPanel';
import {
  ListChecks,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Star,
} from 'lucide-react';

const EMPTY_FORM = {
  role: '',
  checklist: [],
  is_default: false,
};

export default function OrientationChecklists({ standalone = true }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const fetchAll = async () => {
    try {
      const response = await orientationChecklistAPI.getAll();
      setRecords(response.data || []);
    } catch {
      toast.error('Failed to load orientation checklists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await orientationChecklistAPI.update(editing.id, form);
        toast.success('Checklist updated successfully');
      } else {
        await orientationChecklistAPI.create(form);
        toast.success('Checklist created successfully');
      }
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = record => {
    setEditing(record);
    setForm({
      role: record.role || '',
      checklist: record.checklist || [],
      is_default: record.is_default || false,
    });
    setShowModal(true);
  };

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this checklist?')) return;
    try {
      await orientationChecklistAPI.delete(id);
      toast.success('Checklist deleted successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to delete checklist');
    }
  };

  const handleSetDefault = async id => {
    try {
      await orientationChecklistAPI.update(id, { is_default: true });
      toast.success('Default checklist updated');
      fetchAll();
    } catch (err) {
      toast.error('Failed to set default checklist');
    }
  };

  const handleAddChecklistItem = () => {
    setForm({
      ...form,
      checklist: [...form.checklist, { item: '', completed: false }],
    });
  };

  const handleUpdateChecklistItem = (index, field, value) => {
    const updated = [...form.checklist];
    updated[index][field] = value;
    setForm({ ...form, checklist: updated });
  };

  const handleRemoveChecklistItem = index => {
    setForm({
      ...form,
      checklist: form.checklist.filter((_, i) => i !== index),
    });
  };

  const filteredRecords = records.filter(
    r =>
      (r.role || '').toLowerCase().includes(search.toLowerCase()) &&
      (filterRole ? r.role === filterRole : true)
  );

  const columns = [
    {
      header: 'Role',
      render: row => (
        <div className="flex items-center gap-2">
          {row.is_default && <Star className="w-4 h-4 text-yellow-500" />}
          <span className="font-medium">{row.role || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Items',
      render: row => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {row.checklist?.length || 0} items
        </span>
      ),
    },
    {
      header: 'Default',
      render: row => (
        row.is_default ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-slate-400" />
        )
      ),
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {!row.is_default && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSetDefault(row.id)}
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageInfoPanel
        title="Orientation Checklists"
        description="Manage orientation checklists for different roles"
        icon={<ListChecks className="w-6 h-6" />}
        breadcrumbs={[{ label: 'HR Ops', href: '/admin/hr-ops' }, { label: 'Orientation Checklists' }]}
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Checklist
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <TrainingEmptyState
          title="No orientation checklists found"
          description="Create your first orientation checklist to get started"
          actionLabel="Create Checklist"
          onAction={() => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }}
        />
      ) : (
        <Card>
          <Table columns={columns} data={filteredRecords} />
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); }}
        title={editing ? 'Edit Checklist' : 'New Checklist'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Input
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              placeholder="e.g., Developer, Manager, HR"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Checklist Items</label>
            <div className="space-y-2">
              {form.checklist.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={item.item}
                    onChange={e => handleUpdateChecklistItem(index, 'item', e.target.value)}
                    placeholder="Checklist item"
                    required
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveChecklistItem(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddChecklistItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_default" className="text-sm">Set as default for this role</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
