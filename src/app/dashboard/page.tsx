'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar as CalendarIcon, Clock, Building2, CheckCircle2, 
  XCircle, PlusCircle, LogOut, Shield, FileText, ChevronLeft, ChevronRight,
  UserCheck, Users, Settings, Edit3, Trash2, Key, Check, AlertCircle, RefreshCw,
  UserPlus, Eye, Printer, User, Phone, MapPin, Armchair, Mic
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  
  // Navigation Tab State for Admin
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'rooms'>('overview');

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);

  const [selectedDayBookings, setSelectedDayBookings] = useState<any[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form states - Booking
  const [selectedRoom, setSelectedRoom] = useState('');
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [attendeesCount, setAttendeesCount] = useState(10);
  const [chairsCount, setChairsCount] = useState(10);
  const [tablesCount, setTablesCount] = useState(2);
  const [micsCount, setMicsCount] = useState(2);
  const [vipList, setVipList] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Form states - Room Creation / Edit
  const [roomFormId, setRoomFormId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(50);
  const [newRoomLocation, setNewRoomLocation] = useState('อาคารศูนย์ราชการ');
  const [newRoomFloor, setNewRoomFloor] = useState('ชั้น 2');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Form states - User Creation / Edit
  const [userFormId, setUserFormId] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormAgency, setUserFormAgency] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormRole, setUserFormRole] = useState<'user' | 'approver' | 'admin'>('user');
  const [userFormStatus, setUserFormStatus] = useState<'active' | 'pending' | 'disabled'>('active');

  const supabase = createClient();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userProfile?.status === 'pending') {
      await supabase.auth.signOut();
      router.push('/login');
      return;
    }

    setProfile(userProfile);

    fetchRooms();
    fetchBookings();
    if (userProfile?.role === 'admin') {
      fetchUsers();
    }
    setLoading(false);
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms');
      const json = await res.json();
      if (json.rooms) {
        setRooms(json.rooms);
        if (json.rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(json.rooms[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, rooms(name, capacity, location, floor)')
      .order('created_at', { ascending: false });

    setBookings(data || []);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (json.users) {
        setUsersList(json.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // User Management Actions
  const handleUserStatusChange = async (userId: string, newStatus: 'active' | 'rejected' | 'disabled') => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const json = await res.json();

      if (json.error) {
        alert('เกิดข้อผิดพลาด: ' + json.error);
      } else {
        await fetchUsers();
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดของระบบ: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: 'user' | 'approver' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const json = await res.json();

      if (json.error) {
        alert('เกิดข้อผิดพลาด: ' + json.error);
      } else {
        await fetchUsers();
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดของระบบ: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Delete User (Admin)
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`คุณต้องการลบผู้ใช้งาน "${userName}" ใช่หรือไม่? (ไม่สามารถย้อนกลับได้)`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        alert('เกิดข้อผิดพลาดในการลบ: ' + json.error);
      } else {
        await fetchUsers();
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Save Add/Edit User (Admin)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(userFormId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'edit_profile' : 'create',
          userId: userFormId,
          email: userFormEmail,
          password: userFormPassword,
          fullName: userFormFullName,
          agencyName: userFormAgency,
          phone: userFormPhone,
          role: userFormRole,
          status: userFormStatus,
        }),
      });

      const json = await res.json();
      if (json.error) {
        alert('เกิดข้อผิดพลาด: ' + json.error);
      } else {
        setShowAddUserModal(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const openEditUserModal = (user: any) => {
    setUserFormId(user.id);
    setUserFormEmail(user.email);
    setUserFormPassword('');
    setUserFormFullName(user.full_name || '');
    setUserFormAgency(user.agency_name || '');
    setUserFormPhone(user.phone || '');
    setUserFormRole(user.role || 'user');
    setUserFormStatus(user.status || 'active');
    setShowAddUserModal(true);
  };

  const openAddUserModal = () => {
    setUserFormId('');
    setUserFormEmail('');
    setUserFormPassword('');
    setUserFormFullName('');
    setUserFormAgency('สำนักงานจังหวัดกำแพงเพชร');
    setUserFormPhone('');
    setUserFormRole('user');
    setUserFormStatus('active');
    setShowAddUserModal(true);
  };

  // Save Add/Edit Room (Admin via API Route)
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName) return;

    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roomFormId || undefined,
          name: newRoomName,
          capacity: newRoomCapacity,
          location: newRoomLocation,
          floor: newRoomFloor,
          description: newRoomDesc,
          status: 'active'
        }),
      });

      const json = await res.json();
      if (json.error) {
        alert('เกิดข้อผิดพลาด: ' + json.error);
      } else {
        setShowAddRoomModal(false);
        setEditingRoom(null);
        setRoomFormId('');
        setNewRoomName('');
        fetchRooms();
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดของระบบ: ' + err.message);
    }
  };

  const openEditRoomModal = (room: any) => {
    setRoomFormId(room.id);
    setNewRoomName(room.name);
    setNewRoomCapacity(room.capacity || 50);
    setNewRoomLocation(room.location || 'อาคารศูนย์ราชการ');
    setNewRoomFloor(room.floor || 'ชั้น 2');
    setNewRoomDesc(room.description || '');
    setShowAddRoomModal(true);
  };

  const openAddRoomModal = () => {
    setRoomFormId('');
    setNewRoomName('');
    setNewRoomCapacity(50);
    setNewRoomLocation('อาคารศูนย์ราชการจังหวัดกำแพงเพชร');
    setNewRoomFloor('ชั้น 2');
    setNewRoomDesc('');
    setShowAddRoomModal(true);
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`คุณต้องการลบห้องประชุม "${roomName}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/admin/rooms?id=${roomId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) {
        alert('เกิดข้อผิดพลาดในการลบ: ' + json.error);
      } else {
        fetchRooms();
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!selectedRoom || !bookingTitle || !bookingDate || !startTime || !endTime) {
      setSubmitError('กรุณากรอกข้อมูลสำคัญให้ครบถ้วน');
      return;
    }

    // Conflict Check
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', selectedRoom)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'approved'])
      .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

    if (conflicts && conflicts.length > 0) {
      setSubmitError('ช่วงเวลาและวันที่เลือก มีผู้จองห้องประชุมนี้ไว้แล้ว');
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      room_id: selectedRoom,
      user_id: profile.id,
      title: bookingTitle,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      attendees_count: attendeesCount,
      requester_name: profile.full_name,
      requester_agency: profile.agency_name,
      requester_phone: profile.phone || '-',
      chairs_count: chairsCount,
      tables_count: tablesCount,
      microphones_count: micsCount,
      vip_list: vipList,
      notes: notes,
      status: 'pending',
    });

    if (error) {
      setSubmitError('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } else {
      setSubmitSuccess('ส่งคำขอจองห้องประชุมสำเร็จเรียบร้อย!');
      setTimeout(() => {
        setShowBookingModal(false);
        setSubmitSuccess('');
        fetchBookings();
      }, 1200);
    }
  };

  // HANDLER FOR APPROVE & REJECT
  const handleApproveReject = async (bookingId: string, newStatus: 'approved' | 'rejected') => {
    let reason = '';
    if (newStatus === 'rejected') {
      const inputReason = prompt('บังคับกรอก: เหตุผลที่ไม่สามารถอนุมัติการจองนี้ได้');
      if (!inputReason || inputReason.trim() === '') {
        alert('กรุณาระบุเหตุผลการไม่อนุมัติ');
        return;
      }
      reason = inputReason;
    }

    setUpdatingBookingId(bookingId);

    try {
      const res = await fetch('/api/bookings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: newStatus,
          approverId: profile.id,
          rejectionReason: reason,
        }),
      });

      const json = await res.json();

      if (json.error) {
        alert('เกิดข้อผิดพลาด: ' + json.error);
      } else {
        await fetchBookings();
        if (selectedDayBookings) {
          setSelectedDayBookings(null);
        }
        if (selectedBookingDetail && selectedBookingDetail.id === bookingId) {
          setSelectedBookingDetail(json.booking);
        }
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดของระบบ: ' + err.message);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthNamesThai = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const getBookingsForDate = (dayNumber: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return {
      dateStr,
      items: bookings.filter((b) => b.booking_date === dateStr),
    };
  };

  const handleDayClick = (dayNumber: number) => {
    const { dateStr, items } = getBookingsForDate(dayNumber);
    setSelectedDateStr(dateStr);
    setSelectedDayBookings(items);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700 font-medium">
        กำลังโหลดข้อมูลระบบจองห้องประชุม...
      </div>
    );
  }

  // Summary counts
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const rejectedCount = bookings.filter((b) => b.status === 'rejected').length;
  const pendingUsersCount = usersList.filter((u) => u.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/images/logo.png" alt="ตราประจำจังหวัดกำแพงเพชร" className="w-10 h-10 object-contain drop-shadow" />
            <div>
              <h1 className="font-bold text-base leading-tight">ระบบจองห้องประชุม</h1>
              <p className="text-xs text-blue-300">ศูนย์ราชการจังหวัดกำแพงเพชร</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>{profile?.full_name} ({profile?.agency_name})</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold uppercase">
                {profile?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-slate-300 hover:text-white text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner with Auditorium Photo Showcase & Actions */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-lg border border-slate-200">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hall.jpg" 
              alt="หอประชุมใหญ่" 
              className="w-full h-full object-cover opacity-25 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent"></div>
          </div>

          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold">
                <img src="/images/logo.png" alt="โลโก้" className="w-4 h-4 object-contain" />
                <span>สำนักงานจังหวัดกำแพงเพชร</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ยินดีต้อนรับ, {profile?.full_name} 👋
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                ระบบบริการจองห้องประชุม หอประชุมใหญ่ และห้องประชุมทรงทอง ศูนย์ราชการจังหวัดกำแพงเพชร
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile?.role === 'admin' && (
                <button
                  onClick={openAddRoomModal}
                  className="flex items-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition shadow-sm text-sm border border-slate-700"
                >
                  <Building2 className="w-4 h-4" />
                  <span>+ เพิ่มห้องประชุมใหม่</span>
                </button>
              )}
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition text-sm"
              >
                <PlusCircle className="w-5 h-5" />
                <span>ยื่นคำขอจองห้องประชุม</span>
              </button>
            </div>
          </div>
        </div>

        {/* ADMIN / APPROVER NAVIGATION TABS */}
        {profile?.role === 'admin' && (
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center transition ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" /> ภาพรวม & ปฏิทินการจอง
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                fetchUsers();
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center relative transition ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4 mr-2" /> อนุมัติสมาชิก & จัดการผู้ใช้ (User Management)
              {pendingUsersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-400 text-amber-950 font-extrabold rounded-full animate-pulse">
                  {pendingUsersCount} รออนุมัติ
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center transition ${
                activeTab === 'rooms'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" /> จัดการห้องประชุม (Rooms)
            </button>
          </div>
        )}

        {/* ==================== TAB 1: OVERVIEW & CALENDAR ==================== */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">คำขอทั้งหมด</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{bookings.length}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between bg-amber-50/20">
                <div>
                  <p className="text-sm font-medium text-amber-700">รออนุมัติ (Pending)</p>
                  <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{pendingCount}</h3>
                </div>
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
                <div>
                  <p className="text-sm font-medium text-emerald-700">อนุมัติแล้ว (Approved)</p>
                  <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{approvedCount}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm flex items-center justify-between bg-red-50/20">
                <div>
                  <p className="text-sm font-medium text-red-700">ไม่อนุมัติ (Rejected)</p>
                  <h3 className="text-3xl font-extrabold text-red-600 mt-1">{rejectedCount}</h3>
                </div>
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* 📅 INTERACTIVE CALENDAR SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                    ปฏิทินการใช้ห้องประชุม
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    คลิกที่แต่ละวันเพื่อตรวจสอบตารางการจอง การใช้ห้อง และเวลาที่ยังว่างอยู่
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={today}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                  >
                    วันนี้
                  </button>
                  <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-slate-800 text-sm px-3">
                      {monthNamesThai[month]} {year + 543}
                    </span>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700">สัญลักษณ์สถานะ:</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-400 mr-1.5"></span>🟡 รออนุมัติ</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></span>🟢 อนุมัติแล้ว</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></span>🔴 ไม่อนุมัติ</span>
                <span className="flex items-center text-slate-400 ml-auto">💡 คลิกที่กล่องวันที่เพื่อดูรายละเอียดเพิ่มเติม</span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, idx) => (
                  <div key={idx} className="py-2 font-bold text-xs text-slate-500 bg-slate-100/70 rounded-lg">
                    {day}
                  </div>
                ))}

                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[105px] bg-slate-50/50 rounded-xl border border-slate-100"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const { items } = getBookingsForDate(dayNum);
                  const isToday =
                    new Date().getDate() === dayNum &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  return (
                    <div
                      key={dayNum}
                      onClick={() => handleDayClick(dayNum)}
                      className={`min-h-[105px] p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between hover:border-blue-400 hover:shadow-md ${
                        isToday
                          ? 'border-blue-500 bg-blue-50/30 font-bold'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-700 bg-slate-100'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {items.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {items.length} รายการ
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 my-1 overflow-hidden">
                        {items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className={`text-[11px] p-1 rounded-md leading-tight truncate border ${
                              item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium'
                                : item.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-800 border-red-200 line-through opacity-70'
                            }`}
                          >
                            ⏱ {item.start_time.slice(0, 5)} {item.title}
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className="text-[10px] text-blue-600 font-semibold text-center">
                            +{items.length - 2} รายการเพิ่มเติม...
                          </div>
                        )}
                      </div>

                      {items.length === 0 && (
                        <div className="text-[10px] text-slate-300 text-center py-2">
                          ว่างตลอดวัน
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  ตารางรวมรายการคำขอจองห้องประชุม
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-4">เลขที่การจอง</th>
                      <th className="p-4">ชื่อหัวข้อประชุม</th>
                      <th className="p-4">ห้องประชุม</th>
                      <th className="p-4">วันที่ / เวลา</th>
                      <th className="p-4">ผู้ขอจอง / หน่วยงาน</th>
                      <th className="p-4">สถานะ</th>
                      <th className="p-4 text-center">รายละเอียด</th>
                      {(profile?.role === 'admin' || profile?.role === 'approver') && (
                        <th className="p-4 text-center">ดำเนินการ (Approver / Admin)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          ยังไม่มีรายการจองห้องประชุมในระบบ
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-mono font-bold text-slate-800">
                            {booking.booking_number}
                          </td>
                          <td className="p-4 font-medium text-slate-900">{booking.title}</td>
                          <td className="p-4">{booking.rooms?.name || 'ห้องประชุม'}</td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{booking.booking_date}</div>
                            <div className="text-xs text-slate-500">{booking.start_time} - {booking.end_time} น.</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-800">{booking.requester_name}</div>
                            <div className="text-xs text-slate-500">{booking.requester_agency}</div>
                          </td>
                          <td className="p-4">
                            {booking.status === 'pending' && (
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold inline-flex items-center">
                                🟡 รออนุมัติ
                              </span>
                            )}
                            {booking.status === 'approved' && (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold inline-flex items-center">
                                🟢 อนุมัติแล้ว
                              </span>
                            )}
                            {booking.status === 'rejected' && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold inline-flex items-center" title={booking.rejection_reason || ''}>
                                🔴 ไม่อนุมัติ
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedBookingDetail(booking)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold inline-flex items-center border border-blue-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> ดูรายละเอียด
                            </button>
                          </td>
                          {(profile?.role === 'admin' || profile?.role === 'approver') && (
                            <td className="p-4 text-center">
                              {updatingBookingId === booking.id ? (
                                <span className="text-xs text-blue-600 font-bold animate-pulse">กำลังบันทึก...</span>
                              ) : booking.status === 'pending' ? (
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleApproveReject(booking.id, 'approved')}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                  >
                                    ✓ อนุมัติ
                                  </button>
                                  <button
                                    onClick={() => handleApproveReject(booking.id, 'rejected')}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                  >
                                    ✕ ไม่อนุมัติ
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center items-center space-x-2">
                                  <span className="text-xs text-slate-400">
                                    {booking.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                                  </span>
                                  <button
                                    onClick={() => handleApproveReject(booking.id, booking.status === 'approved' ? 'rejected' : 'approved')}
                                    className="text-[11px] underline text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    เปลี่ยนสถานะ
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 2: USER MANAGEMENT & APPROVALS (ADMIN ONLY) ==================== */}
        {activeTab === 'users' && profile?.role === 'admin' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-600" />
                  การอนุมัติสมาชิกผู้ลงทะเบียน & จัดการผู้ใช้งาน (User Management)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  อนุมัติสิทธิ์การใช้งานสำหรับผู้สมัครใหม่ เปลี่ยนบทบาท (Role) แก้ไข หรือลบผู้ใช้
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={openAddUserModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center transition"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" /> + เพิ่มผู้ใช้ใหม่โดย Admin
                </button>
                <button
                  onClick={fetchUsers}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> รีเฟรช
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-4">ชื่อ-นามสกุล</th>
                    <th className="p-4">หน่วยงาน / ส่วนราชการ</th>
                    <th className="p-4">อีเมล (Email)</th>
                    <th className="p-4">บทบาท (Role)</th>
                    <th className="p-4">สถานะการอนุมัติ</th>
                    <th className="p-4 text-center">จัดการผู้ใช้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        กำลังโหลดข้อมูลผู้ใช้งาน...
                      </td>
                    </tr>
                  ) : (
                    usersList.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{userItem.full_name || 'ผู้ใช้งาน'}</td>
                        <td className="p-4">{userItem.agency_name || '-'}</td>
                        <td className="p-4 font-mono text-xs">{userItem.email}</td>
                        <td className="p-4">
                          <select
                            value={userItem.role}
                            disabled={updatingUserId === userItem.id}
                            onChange={(e) => handleUserRoleChange(userItem.id, e.target.value as any)}
                            className="border border-slate-300 rounded-lg p-1.5 text-xs bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
                          >
                            <option value="user">User (ผู้ขอจอง)</option>
                            <option value="approver">Approver (ผู้อนุมัติ)</option>
                            <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {userItem.status === 'pending' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold animate-pulse">
                              ⏳ รอ Admin อนุมัติ
                            </span>
                          )}
                          {userItem.status === 'active' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                              🟢 อนุมัติใช้งานแล้ว
                            </span>
                          )}
                          {userItem.status === 'disabled' && (
                            <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
                              ⚪ ระงับใช้งาน
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            {userItem.status === 'pending' ? (
                              <button
                                onClick={() => handleUserStatusChange(userItem.id, 'active')}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                              >
                                ✓ อนุมัติสิทธิ์
                              </button>
                            ) : (
                              <button
                                onClick={() => openEditUserModal(userItem)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center"
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" /> แก้ไข
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(userItem.id, userItem.full_name || userItem.email)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition flex items-center border border-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: ROOM MANAGEMENT (ADMIN ONLY) ==================== */}
        {activeTab === 'rooms' && profile?.role === 'admin' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <Building2 className="w-6 h-6 mr-2 text-blue-600" />
                  จัดการห้องประชุม (Room Management)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  เพิ่ม แก้ไขรายละเอียด หรือลบห้องประชุมภายในศูนย์ราชการ
                </p>
              </div>
              <button
                onClick={openAddRoomModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" /> + เพิ่มห้องประชุมใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">{room.name}</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                        {room.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{room.description || 'ห้องประชุมมาตรฐานศูนย์ราชการ'}</p>
                    <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                      <div>👥 <strong>ความจุ:</strong> {room.capacity} คน</div>
                      <div>📍 <strong>สถานที่:</strong> {room.location || 'อาคารศูนย์ราชการ'}</div>
                      <div>🏢 <strong>ชั้น:</strong> {room.floor || 'ชั้น 2'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => openEditRoomModal(room)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-600" /> แก้ไขรายละเอียด
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> ลบห้อง
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer with Creator Credit */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 mt-auto text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.png" alt="ตราประจำจังหวัดกำแพงเพชร" className="w-5 h-5 object-contain" />
            <span>ระบบบริการจองห้องประชุม ศูนย์ราชการจังหวัดกำแพงเพชร</span>
          </div>
          <div>
            พัฒนาและออกแบบระบบโดย <span className="text-blue-400 font-bold">ณัฐพงศ์ ม่วงบุญ</span> | สำนักงานจังหวัดกำแพงเพชร
          </div>
        </div>
      </footer>

      {/* 📄 FULL BOOKING DETAIL MODAL */}
      {selectedBookingDetail !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 print:p-0 print:shadow-none print:max-w-none">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="โลโก้" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    ใบขออนุญาตใช้ห้องประชุม (แบบเต็ม)
                  </h3>
                  <p className="text-xs text-blue-600 font-mono font-bold">
                    เลขที่การจอง: {selectedBookingDetail.booking_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold print:hidden"
              >
                ✕
              </button>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${
              selectedBookingDetail.status === 'approved'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : selectedBookingDetail.status === 'pending'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                {selectedBookingDetail.status === 'approved' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                {selectedBookingDetail.status === 'pending' && <Clock className="w-6 h-6 text-amber-600" />}
                {selectedBookingDetail.status === 'rejected' && <XCircle className="w-6 h-6 text-red-600" />}
                <div>
                  <div className="font-bold text-sm">
                    สถานะ: {selectedBookingDetail.status === 'approved' ? '🟢 อนุมัติเรียบร้อยแล้ว' : selectedBookingDetail.status === 'pending' ? '🟡 อยู่ระหว่างรออนุมัติ' : '🔴 ไม่อนุมัติคำขอ'}
                  </div>
                  {selectedBookingDetail.rejection_reason && (
                    <div className="text-xs text-red-700 mt-0.5">
                      เหตุผล: {selectedBookingDetail.rejection_reason}
                    </div>
                  )}
                </div>
              </div>

              {(profile?.role === 'admin' || profile?.role === 'approver') && selectedBookingDetail.status === 'pending' && (
                <div className="flex space-x-2 print:hidden">
                  <button
                    onClick={() => handleApproveReject(selectedBookingDetail.id, 'approved')}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow"
                  >
                    ✓ อนุมัติ
                  </button>
                  <button
                    onClick={() => handleApproveReject(selectedBookingDetail.id, 'rejected')}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow"
                  >
                    ✕ ไม่อนุมัติ
                  </button>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-800 text-base flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-600" />
                  {selectedBookingDetail.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>🏢 <strong>ห้องประชุม:</strong> {selectedBookingDetail.rooms?.name || 'ห้องประชุม'}</div>
                  <div>📍 <strong>สถานที่:</strong> {selectedBookingDetail.rooms?.location || 'อาคารศูนย์ราชการ'}</div>
                  <div>📅 <strong>วันที่จอง:</strong> {selectedBookingDetail.booking_date}</div>
                  <div>⏱ <strong>เวลาใช้งาน:</strong> {selectedBookingDetail.start_time.slice(0, 5)} - {selectedBookingDetail.end_time.slice(0, 5)} น. (24 ชม.)</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center border-b border-slate-100 pb-2">
                    <User className="w-4 h-4 mr-1.5 text-blue-600" /> ข้อมูลผู้ขอจอง / หน่วยงาน
                  </h5>
                  <div className="text-slate-600 space-y-1">
                    <div>👤 <strong>ชื่อผู้ขอจอง:</strong> {selectedBookingDetail.requester_name}</div>
                    <div>🏛️ <strong>หน่วยงาน:</strong> {selectedBookingDetail.requester_agency}</div>
                    <div>📞 <strong>เบอร์โทรศัพท์:</strong> {selectedBookingDetail.requester_phone || '-'}</div>
                    <div>👥 <strong>จำนวนผู้ประชุม:</strong> {selectedBookingDetail.attendees_count || 0} คน</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-800 flex items-center border-b border-slate-100 pb-2">
                    <Armchair className="w-4 h-4 mr-1.5 text-blue-600" /> อุปกรณ์และการจัดห้อง
                  </h5>
                  <div className="text-slate-600 space-y-1">
                    <div>🪑 <strong>จำนวนเก้าอี้:</strong> {selectedBookingDetail.chairs_count || 0} ตัว</div>
                    <div>🪵 <strong>จำนวนโต๊ะ:</strong> {selectedBookingDetail.tables_count || 0} ตัว</div>
                    <div>🎙️ <strong>ไมโครโฟน:</strong> {selectedBookingDetail.microphones_count || 0} ตัว</div>
                    <div>⭐ <strong>ประธาน/VIP:</strong> {selectedBookingDetail.vip_list || 'ไม่มี'}</div>
                  </div>
                </div>
              </div>

              {selectedBookingDetail.notes && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-slate-700">
                  <strong>หมายเหตุเพิ่มเติม:</strong> {selectedBookingDetail.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center transition shadow"
              >
                <Printer className="w-4 h-4 mr-1.5" /> พิมพ์ใบขออนุญาต (PDF)
              </button>
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔍 DAY DETAILS MODAL */}
      {selectedDayBookings !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  ตารางการใช้ห้องประชุม วันที่ {selectedDateStr}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayBookings(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
                  <h4 className="font-bold text-base">วันนี้ห้องประชุมว่างตลอดวัน</h4>
                  <button
                    onClick={() => {
                      setBookingDate(selectedDateStr);
                      setSelectedDayBookings(null);
                      setShowBookingModal(true);
                    }}
                    className="mt-2 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    <PlusCircle className="w-4 h-4 mr-1" /> จองห้องวันนี้ทันที
                  </button>
                </div>
              ) : (
                selectedDayBookings.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border text-sm space-y-2 ${
                      item.status === 'approved'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : item.status === 'pending'
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-red-50/50 border-red-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-700">{item.booking_number}</span>
                      {item.status === 'approved' && <span className="text-xs font-bold text-emerald-700">🟢 อนุมัติแล้ว</span>}
                      {item.status === 'pending' && <span className="text-xs font-bold text-amber-700">🟡 รออนุมัติ</span>}
                      {item.status === 'rejected' && <span className="text-xs font-bold text-red-700">🔴 ไม่อนุมัติ</span>}
                    </div>

                    <div className="font-bold text-slate-900 text-base">{item.title}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                      <div>🏢 <strong>ห้อง:</strong> {item.rooms?.name || 'ห้องประชุมใหญ่'}</div>
                      <div>⏱ <strong>เวลา:</strong> {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} น.</div>
                      <div>🏛️ <strong>หน่วยงาน:</strong> {item.requester_agency}</div>
                      <div>👤 <strong>ผู้ขอจอง:</strong> {item.requester_name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setBookingDate(selectedDateStr);
                  setSelectedDayBookings(null);
                  setShowBookingModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1" /> ยื่นขอจองวันที่นี้
              </button>
              <button
                onClick={() => setSelectedDayBookings(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <PlusCircle className="w-6 h-6 mr-2 text-blue-600" />
                แบบฟอร์มขอจองห้องประชุม
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-200">
                {submitSuccess}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">เลือกห้องประชุม *</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50"
                  required
                >
                  {rooms.length === 0 ? (
                    <option value="">ห้องประชุม 1 (ห้องประชุมใหญ่ ศูนย์ราชการ)</option>
                  ) : (
                    rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.location || 'อาคารศูนย์ราชการ'}) - ความจุ {r.capacity} คน
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อหัวข้อประชุม / กิจกรรม *</label>
                <input
                  type="text"
                  required
                  value={bookingTitle}
                  onChange={(e) => setBookingTitle(e.target.value)}
                  placeholder="เช่น การประชุมคณะกรรมการจัดทำแผนพัฒนาจังหวัด"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่จอง *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เวลาเริ่ม *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">เวลาสิ้นสุด *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">จำนวนผู้เข้าร่วม</label>
                  <input
                    type="number"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">จำนวนเก้าอี้</label>
                  <input
                    type="number"
                    value={chairsCount}
                    onChange={(e) => setChairsCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">จำนวนโต๊ะ</label>
                  <input
                    type="number"
                    value={tablesCount}
                    onChange={(e) => setTablesCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ไมโครโฟน</label>
                  <input
                    type="number"
                    value={micsCount}
                    onChange={(e) => setMicsCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">รายชื่อ VIP / ประธานในพิธี</label>
                <input
                  type="text"
                  value={vipList}
                  onChange={(e) => setVipList(e.target.value)}
                  placeholder="เช่น ผู้ว่าราชการจังหวัดกำแพงเพชร"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุความต้องการการจัดห้องหรืออุปกรณ์เพิ่มเติม"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow transition"
                >
                  ยื่นคำขอจองห้องประชุม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Room Modal (Admin Only) */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                {roomFormId ? 'แก้ไขข้อมูลห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}
              </h3>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อห้องประชุม *</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="เช่น ห้องประชุมทรงทอง 1"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ความจุ (คน)</label>
                  <input
                    type="number"
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">ชั้น</label>
                  <input
                    type="text"
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    placeholder="ชั้น 2"
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">สถานที่ / อาคาร</label>
                <input
                  type="text"
                  value={newRoomLocation}
                  onChange={(e) => setNewRoomLocation(e.target.value)}
                  placeholder="อาคารศูนย์ราชการจังหวัดกำแพงเพชร"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="รายละเอียดเกี่ยวกับอุปกรณ์ อุปกรณ์เชื่อมต่อภาพและเสียง"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow"
                >
                  {roomFormId ? 'บันทึกการแก้ไข' : 'บันทึกสร้างห้องประชุม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal (Admin Only) */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                {userFormId ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่โดย Admin'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">อีเมล (Email) *</label>
                <input
                  type="email"
                  required
                  disabled={Boolean(userFormId)}
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  placeholder="user@kpp.go.th"
                  className="w-full border border-slate-300 rounded-xl p-2.5 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {userFormId ? 'รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน *'}
                </label>
                <input
                  type="password"
                  required={!userFormId}
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={userFormFullName}
                  onChange={(e) => setUserFormFullName(e.target.value)}
                  placeholder="นายสมชาย ใจดี"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">หน่วยงาน / ส่วนราชการ</label>
                <input
                  type="text"
                  value={userFormAgency}
                  onChange={(e) => setUserFormAgency(e.target.value)}
                  placeholder="สำนักงานจังหวัดกำแพงเพชร"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ผู้ประสานงาน</label>
                <input
                  type="tel"
                  value={userFormPhone}
                  onChange={(e) => setUserFormPhone(e.target.value)}
                  placeholder="055-123456"
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">บทบาท (Role)</label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold"
                  >
                    <option value="user">User (ผู้ขอจอง)</option>
                    <option value="approver">Approver (ผู้อนุมัติ)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">สถานะสิทธิ์</label>
                  <select
                    value={userFormStatus}
                    onChange={(e) => setUserFormStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-slate-50 font-semibold"
                  >
                    <option value="active">🟢 อนุมัติใช้งาน</option>
                    <option value="pending">⏳ รออนุมัติ</option>
                    <option value="disabled">⚪ ระงับใช้งาน</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow"
                >
                  {userFormId ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้ใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
