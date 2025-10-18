import { useState, useEffect } from 'react';
import { Mapping, MappingFormData, User, Device } from '../types/pages.types';
import { toast } from "react-toastify";

export default function MapDevice() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<MappingFormData>({
    deviceId: '',
    userId: '',
    mappingDate: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [unmappedDevices, setUnmappedDevices] = useState<Device[]>([]);

  useEffect(() => {
    // Mock data for users and devices
    setUsers([
      {
        id: 1, name: 'John Doe',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 2, name: 'Jane Smith',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 3, name: 'Bob Johnson',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 4, name: 'Alice Brown',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 5, name: 'Michael Wilson',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 6, name: 'Sarah Davis',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 7, name: 'David Miller',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 8, name: 'Emma Taylor',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 9, name: 'James Anderson',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
      {
        id: 10, name: 'Lisa Martinez',
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        registerDate: '',
        companyName: '',
        device: '',
        status: ''
      },
    ]);

    setUnmappedDevices([
      {
        id: "1", name: 'Device A',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "2", name: 'Device B',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "3", name: 'Device C',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "4", name: 'Device D',
        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "5", name: 'Device E',
        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "6", name: 'Device F',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "7", name: 'Device G',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "8", name: 'Device H',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {

        id: "9", name: 'Device I',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
      {
        id: "10", name: 'Device J',

        deviceName: '',
        deviceType: '',
        machineSerialNo: '',
        companyName: '',
        gatewayId: '',
        installationDate: '',
        location: null,
        status: ''
      },
    ]);

    // Initial mappings data
    setMappings([
      { id: 1, deviceId: 1, userId: 1, deviceName: 'Device A', userName: 'John Doe', mappingDate: '2024-01-15' },
      { id: 2, deviceId: 2, userId: 2, deviceName: 'Device B', userName: 'Jane Smith', mappingDate: '2024-01-16' },
      { id: 3, deviceId: 3, userId: 3, deviceName: 'Device C', userName: 'Bob Johnson', mappingDate: '2024-01-17' },
      { id: 4, deviceId: 4, userId: 4, deviceName: 'Device D', userName: 'Alice Brown', mappingDate: '2024-01-18' },
      { id: 5, deviceId: 5, userId: 5, deviceName: 'Device E', userName: 'Michael Wilson', mappingDate: '2024-01-19' },
      { id: 6, deviceId: 6, userId: 6, deviceName: 'Device F', userName: 'Sarah Davis', mappingDate: '2024-01-20' },
      { id: 7, deviceId: 7, userId: 7, deviceName: 'Device G', userName: 'David Miller', mappingDate: '2024-01-21' },
      { id: 8, deviceId: 8, userId: 8, deviceName: 'Device H', userName: 'Emma Taylor', mappingDate: '2024-01-22' },
      { id: 9, deviceId: 9, userId: 9, deviceName: 'Device I', userName: 'James Anderson', mappingDate: '2024-01-23' },
      { id: 10, deviceId: 10, userId: 10, deviceName: 'Device J', userName: 'Lisa Martinez', mappingDate: '2024-01-24' },
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deviceId || !formData.userId || !formData.mappingDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const selectedDevice = unmappedDevices.find(d => d.id === formData.deviceId);
    const selectedUser = users.find(u => u.id === parseInt(formData.userId));

    if (!selectedDevice || !selectedUser) {
      toast.error('Invalid device or user selection');
      return;
    }

    if (editingMapping) {
      setMappings(mappings.map(mapping =>
        mapping.id === editingMapping.id
          ? {
              ...mapping,
              deviceId: parseInt(formData.deviceId),
              userId: parseInt(formData.userId),
              deviceName: selectedDevice.name ?? '',
              userName: selectedUser.name ?? '',
              mappingDate: formData.mappingDate
            }
          : mapping
      ));
      toast.success("Mapping updated!");
    } else {
      setMappings([...mappings, {
        id: Date.now(),
        deviceId: parseInt(formData.deviceId),
        userId: parseInt(formData.userId),
        deviceName: selectedDevice.name ?? '',
        userName: selectedUser.name ?? '',
        mappingDate: formData.mappingDate
      }]);
      toast.success("Mapping added!");
    }

    setShowForm(false);
    setEditingMapping(null);
    setFormData({ deviceId: '', userId: '', mappingDate: '' });
  };

  const handleEdit = (mapping: Mapping) => {
    setEditingMapping(mapping);
    setFormData({
      deviceId: mapping.deviceId.toString(),
      userId: mapping.userId.toString(),
      mappingDate: mapping.mappingDate
    });
    setShowForm(true);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<Mapping | null>(null);

  const handleDeleteClick = (mapping: Mapping) => {
    setMappingToDelete(mapping);
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (mappingToDelete) {
      setMappings(mappings.filter(mapping => mapping.id !== mappingToDelete.id));
      setShowDeleteConfirm(false);
      setMappingToDelete(null);
      toast.success("Mapping deleted!");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Device Mapping</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
        >
          Add New Mapping
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Device</label>
                <select
                  value={formData.deviceId}
                  onChange={(e) => setFormData({...formData, deviceId: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a device</option>
                  {unmappedDevices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mapping Date</label>
                <input
                  type="date"
                  value={formData.mappingDate}
                  onChange={(e) => setFormData({...formData, mappingDate: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMapping(null);
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  {editingMapping ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search mappings..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="px-4 py-2">Device Name</th>
              <th className="px-4 py-2">User Name</th>
              <th className="px-4 py-2">Mapping Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.filter(mapping => 
              mapping.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mapping.userName.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((mapping) => (
              <tr key={mapping.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{mapping.deviceName}</td>
                <td className="px-4 py-2">{mapping.userName}</td>
                <td className="px-4 py-2">{mapping.mappingDate}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEdit(mapping)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteClick(mapping)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">Are you sure you want to delete mapping for device {mappingToDelete?.deviceName}?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMappingToDelete(null);
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
