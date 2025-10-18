import { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { User, UserFormData } from '../types/pages.types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    registerDate: '',
    companyName: '',
    device: 'Machine 1'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load initial mock data
    setUsers([
      {
        id: 1,
        firstName: 'Luna',
        lastName: 'Fermoyle',
        email: 'luna.f@gmail.com',
        contact: '9123456780',
        registerDate: '2024-01-01',
        companyName: 'Rashi Soin Tech',
        device: 'Machine 1',
        status: 'Active'
      },
      {
        id: 2,
        firstName: 'Nicholas',
        lastName: 'Simone',
        email: 'nicholas.s@gmail.com',
        contact: '8234567890',
        registerDate: '2024-01-02',
        companyName: 'Rashi Soin Tech',
        device: 'Machine 1',
        status: 'Active'
      },
      {
        id: 3,
        firstName: 'Pooja',
        lastName: 'Patil',
        email: 'pooja.p@gmail.com',
        contact: '7345678901',
        registerDate: '2024-01-03',
        companyName: 'Rashi Soin Tech',
        device: 'NaN',
        status: 'Active'
      },
      {
        id: 4,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.d@gmail.com',
        contact: '6456789012',
        registerDate: '2024-01-04',
        companyName: 'Rashi Soin Tech',
        device: 'Machine 1',
        status: 'Active'
      },
      {
        id: 5,
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.w@gmail.com',
        contact: '9567890123',
        registerDate: '2024-01-05',
        companyName: 'Rashi Soin Tech',
        device: 'NaN',
        status: 'Active'
      },
      {
        id: 6,
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.b@gmail.com',
        contact: '8678901234',
        registerDate: '2024-01-06',
        companyName: 'Rashi Soin Tech',
        device: 'Machine 1',
        status: 'Active'
      },
      {
        id: 7,
        firstName: 'Sarah',
        lastName: 'Davis',
        email: 'sarah.d@gmail.com',
        contact: '7789012345',
        registerDate: '2024-01-07',
        companyName: 'Rashi Soin Tech',
        device: 'NaN',
        status: 'Active'
      },
      {
        id: 8,
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.m@gmail.com',
        contact: '6890123456',
        registerDate: '2024-01-08',
        companyName: 'Rashi Soin Tech',
        device: 'Machine 1',
        status: 'Active'
      },
      {
        id: 9,
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.a@gmail.com',
        contact: '9901234567',
        registerDate: '2024-01-09',
        companyName: 'Rashi Soin Tech',
        device: 'NaN',
        status: 'Active'
      },
      {
        id: 10,
        firstName: 'James',
        lastName: 'Taylor',
        email: 'james.t@gmail.com',
        contact: '8012345678',
        registerDate: '2024-01-10',
        companyName: 'Rashi Soin Tech',
        device: 'Machine 1',
        status: 'Active'
      }
    ]);
  }, []);

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.contact || !/^[6-9]\d{9}$/.test(formData.contact)) {
      newErrors.contact = 'Contact must start with 6-9 and be exactly 10 digits';
    }
    if (!formData.companyName) newErrors.companyName = 'Company name is required';
    if (!formData.registerDate) newErrors.registerDate = 'Register date is required';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form.");
      return;
    }
    if (editingUser) {
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...formData, id: user.id, status: 'Active' } : user
      ));
      toast.success("User updated!");
    } else {
      setUsers([...users, { ...formData, id: Date.now(), status: 'Active' }]);
      toast.success("User added!");
    }
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      contact: '',
      registerDate: '',
      companyName: '',
      device: 'Machine 1'
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setShowForm(true);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      toast.success("User deleted!");
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contact.includes(searchTerm)
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
        >
          Add New User
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                {errors?.firstName && <span className="text-red-500 text-sm">{errors.firstName}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                {errors?.lastName && <span className="text-red-500 text-sm">{errors.lastName}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                {errors?.email && <span className="text-red-500 text-sm">{errors.email}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                {errors?.contact && <span className="text-red-500 text-sm">{errors.contact}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Register Date</label>
                <input
                  type="date"
                  value={formData.registerDate}
                  onChange={(e) => setFormData({...formData, registerDate: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                {errors?.registerDate && <span className="text-red-500 text-sm">{errors.registerDate}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
                {errors?.companyName && <span className="text-red-500 text-sm">{errors.companyName}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                <select
                  value={formData.device}
                  onChange={(e) => setFormData({...formData, device: e.target.value})}
                  className="w-full p-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Machine 1">Machine 1</option>
                  <option value="NaN">NaN</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setErrors({});
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {editingUser ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone Number</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Company Name</th>
              <th className="px-4 py-2">Device</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.contact}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-2">{user.companyName}</td>
                <td className="px-4 py-2">{user.device}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
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
            <p className="mb-4">Are you sure you want to delete user {userToDelete?.firstName} {userToDelete?.lastName}?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
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
