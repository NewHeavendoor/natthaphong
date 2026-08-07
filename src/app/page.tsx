'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar as CalendarIcon, Clock, Building2, ShieldCheck, 
  CheckCircle, ArrowRight, UserCheck, Sparkles, ChevronLeft, ChevronRight, XCircle, Eye
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const [showPublicCalendar, setShowPublicCalendar] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayBookings, setSelectedDayBookings] = useState<any[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    const { data: roomsData } = await supabase.from('rooms').select('*').eq('status', 'active');
    setRooms(roomsData || []);

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, rooms(name)')
      .in('status', ['approved', 'pending']);
    setBookings(bookingsData || []);
  };

  // Calendar calculations
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <img 
                src="/images/logo.png" 
                alt="ตราประจำจังหวัดกำแพงเพชร" 
                className="w-12 h-12 object-contain drop-shadow-md transition hover:scale-105 duration-200" 
              />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white leading-tight flex items-center gap-2">
                ระบบบริการจองห้องประชุม
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-medium">
                  ศูนย์ราชการ
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">สำนักงานจังหวัดกำแพงเพชร</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPublicCalendar(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-xl border border-slate-700 text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span>ดูปฏิทินห้องประชุม</span>
            </button>
            <Link
              href="/login"
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              ลงทะเบียนใช้งาน
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-900/40 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>ยกระดับการบริหารจัดการภาครัฐ สู่ยุคดิจิทัล</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              ระบบจองห้องประชุมออนไลน์ <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                ศูนย์ราชการจังหวัดกำแพงเพชร
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              สะดวก รวดเร็ว ตรวจสอบสถานะการใช้งานห้องประชุมแบบเรียลไทม์ผ่านปฏิทินอิเล็กทรอนิกส์ 
              ลดความซ้ำซ้อนของการจอง พร้อมระบบแจ้งเตือนอัตโนมัติถึงเจ้าหน้าที่
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setShowPublicCalendar(true)}
                className="flex items-center space-x-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 text-sm"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>ตรวจสอบตารางปฏิทินห้องประชุม</span>
              </button>

              <Link
                href="/login"
                className="flex items-center space-x-2 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold rounded-2xl border border-slate-700 transition text-sm"
              >
                <span>ยื่นขอจองห้องประชุม</span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </Link>
            </div>

            {/* Quick Specs badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">รองรับห้องประชุม</p>
                <p className="font-bold text-white text-sm mt-0.5">หอประชุมใหญ่ & ห้องทรงทอง</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">ความจุสูงสุด</p>
                <p className="font-bold text-blue-400 text-sm mt-0.5">300 - 500+ ที่นั่ง</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] text-slate-400">ระบบตรวจสอบ</p>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">ป้องกันการจองซ้ำ 100%</p>
              </div>
            </div>
          </div>

          {/* Hero Right Showcase Image (Auditorium & Logo Frame) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
              <img 
                src="/images/hall.jpg" 
                alt="หอประชุมใหญ่ ศูนย์ราชการจังหวัดกำแพงเพชร" 
                className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition duration-500 brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
              
              {/* Province Logo Floating Badge */}
              <div className="absolute top-4 left-4 flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-500/40 shadow-lg">
                <img src="/images/logo.png" alt="โลโก้จังหวัด" className="w-8 h-8 object-contain" />
                <div>
                  <p className="text-[11px] font-bold text-amber-300">หอประชุมใหญ่ประจำจังหวัด</p>
                  <p className="text-[10px] text-slate-400">ศูนย์ราชการจังหวัดกำแพงเพชร</p>
                </div>
              </div>

              {/* Bottom Caption Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">หอประชุมใหญ่ ศูนย์ราชการจังหวัด</h3>
                    <p className="text-xs text-slate-300">พร้อมอุปกรณ์ระบบภาพ แสง เสียง เวทีสมบูรณ์แบบ</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-lg whitespace-nowrap">
                    พร้อมใช้งาน
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 📅 PUBLIC CALENDAR MODAL */}
      {showPublicCalendar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-8 text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="โลโก้" className="w-10 h-10 object-contain" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-400" />
                    ปฏิทินการใช้ห้องประชุม ศูนย์ราชการจังหวัดกำแพงเพชร
                  </h3>
                  <p className="text-xs text-slate-400">ตรวจสอบวันและเวลาที่ว่างเพื่อวางแผนการขอใช้บริการ</p>
                </div>
              </div>
              <button
                onClick={() => setShowPublicCalendar(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <button
                  onClick={today}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
                >
                  วันนี้
                </button>
                <span className="font-bold text-base text-white">
                  {monthNamesThai[month]} {year + 543}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition border border-slate-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition border border-slate-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <span className="font-bold text-white">สัญลักษณ์:</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></span>🟢 อนุมัติแล้ว</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-400 mr-1.5"></span>🟡 รอพิจารณา</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, idx) => (
                <div key={idx} className="py-2 font-bold text-xs text-slate-400 bg-slate-800/40 rounded-lg">
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] bg-slate-950/30 rounded-xl border border-slate-900"></div>
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
                    className={`min-h-[90px] p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between hover:border-blue-500 hover:bg-slate-800/80 ${
                      isToday
                        ? 'border-blue-500 bg-blue-950/30 font-bold'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isToday ? 'bg-blue-600 text-white' : 'text-slate-300 bg-slate-800'
                      }`}>
                        {dayNum}
                      </span>
                      {items.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">{items.length} งาน</span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-hidden">
                      {items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className={`text-[10px] p-1 rounded leading-tight truncate border ${
                            item.status === 'approved'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60 font-medium'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          ⏱ {item.start_time.slice(0, 5)} {item.title}
                        </div>
                      ))}
                      {items.length > 2 && (
                        <div className="text-[9px] text-blue-400 text-center font-bold">
                          +{items.length - 2} รายการ
                        </div>
                      )}
                    </div>

                    {items.length === 0 && (
                      <div className="text-[10px] text-slate-600 text-center py-1">ว่างตลอดวัน</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition"
              >
                เข้าสู่ระบบเพื่อจองห้องประชุม
              </Link>
              <button
                onClick={() => setShowPublicCalendar(false)}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Day Detail Modal for Public Calendar */}
      {selectedDayBookings !== null && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-blue-400" />
                ตารางใช้ห้องประชุม วันที่ {selectedDateStr}
              </h3>
              <button onClick={() => setSelectedDayBookings(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-8 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-300 space-y-1">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
                  <p className="font-bold text-sm">วันนี้ยังไม่มีการจองห้องประชุม (ว่างตลอดวัน)</p>
                </div>
              ) : (
                selectedDayBookings.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.status === 'approved' ? '🟢 อนุมัติแล้ว' : '🟡 รออนุมัติ'}
                      </span>
                    </div>
                    <div className="text-slate-400 pt-1">
                      <div>🏢 <strong>ห้อง:</strong> {item.rooms?.name || 'ห้องประชุมใหญ่'}</div>
                      <div>⏱ <strong>เวลา:</strong> {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} น.</div>
                      <div>🏛️ <strong>หน่วยงาน:</strong> {item.requester_agency}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
                เข้าสู่ระบบเพื่อยื่นขอจอง
              </Link>
              <button onClick={() => setSelectedDayBookings(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Creator Credit */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.png" alt="โลโก้" className="w-5 h-5 object-contain" />
            <span>© 2026 ระบบบริการจองห้องประชุม ศูนย์ราชการจังหวัดกำแพงเพชร</span>
          </div>
          <div className="text-slate-400 font-medium">
            พัฒนาและออกแบบระบบโดย <span className="text-blue-400 font-bold">ณัฐพงศ์ ม่วงบุญ</span> | สำนักงานจังหวัดกำแพงเพชร
          </div>
        </div>
      </footer>

    </div>
  );
}
