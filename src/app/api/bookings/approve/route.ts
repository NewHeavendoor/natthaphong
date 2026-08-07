import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: อนุมัติ หรือ ไม่อนุมัติ การจองห้องประชุม
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, status, approverId, rejectionReason } = body;

    if (!bookingId || !status || !approverId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน (Missing parameters)' }, { status: 400 });
    }

    if (status === 'rejected' && (!rejectionReason || rejectionReason.trim() === '')) {
      return NextResponse.json({ error: 'กรุณาระบุเหตุผลที่ไม่สามารถอนุมัติได้' }, { status: 400 });
    }

    const updatePayload: any = {
      status: status,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    };

    if (status === 'rejected') {
      updatePayload.rejection_reason = rejectionReason;
    } else {
      updatePayload.rejection_reason = null;
    }

    // Update in Database using Admin Service Role
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .select('*, rooms(name), profiles:user_id(full_name, email, phone)')
      .single();

    if (error) throw error;

    // Send LINE Notification if token exists
    const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const approverGroup = process.env.LINE_APPROVER_GROUP_ID;

    if (lineToken && approverGroup) {
      const statusText = status === 'approved' ? '🟢 อนุมัติการจองแล้ว' : '🔴 ไม่อนุมัติการจอง';
      let msg = `📌 [อัปเดตผลการพิจารณาจองห้องประชุม]\nเลขที่: ${booking.booking_number}\nหัวข้อ: ${booking.title}\nผลการพิจารณา: ${statusText}`;
      if (status === 'rejected') {
        msg += `\nเหตุผล: ${rejectionReason}`;
      }

      fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lineToken}`,
        },
        body: JSON.stringify({
          to: approverGroup,
          messages: [{ type: 'text', text: msg }],
        }),
      }).catch(err => console.error('LINE Notify Error:', err));
    }

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
