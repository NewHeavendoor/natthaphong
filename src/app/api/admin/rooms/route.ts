import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: ดึงรายการห้องประชุมทั้งหมด
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ rooms: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: เพิ่ม หรือ แก้ไข ห้องประชุม
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, capacity, location, floor, description, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อห้องประชุม' }, { status: 400 });
    }

    if (id) {
      // แก้ไขห้องเดิม
      const { data, error } = await supabaseAdmin
        .from('rooms')
        .update({
          name,
          capacity: Number(capacity) || 0,
          location,
          floor,
          description,
          status: status || 'active',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, room: data });
    } else {
      // เพิ่มห้องใหม่
      const { data, error } = await supabaseAdmin
        .from('rooms')
        .insert({
          name,
          capacity: Number(capacity) || 0,
          location,
          floor,
          description,
          status: status || 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, room: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: ลบห้องประชุม
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('id');

    if (!roomId) {
      return NextResponse.json({ error: 'Missing room ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
