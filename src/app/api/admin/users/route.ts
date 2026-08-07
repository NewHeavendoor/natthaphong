import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: ดึงรายการผู้ใช้งานทั้งหมด
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: เพิ่ม, แก้ไขข้อมูล, หรือเปลี่ยนสิทธิ์ผู้ใช้
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, email, password, fullName, agencyName, phone, role, status } = body;

    // 1. สร้างผู้ใช้ใหม่โดย Admin
    if (action === 'create') {
      if (!email || !password || !fullName) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' }, { status: 400 });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, agency_name: agencyName, phone }
      });

      if (authError) throw authError;

      const createdUserId = authData.user.id;

      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: createdUserId,
          email,
          full_name: fullName,
          agency_name: agencyName || '',
          phone: phone || '',
          role: role || 'user',
          status: status || 'active'
        })
        .select()
        .single();

      if (profileError) throw profileError;
      return NextResponse.json({ success: true, user: profileData });
    }

    // 2. แก้ไขข้อมูลผู้ใช้ที่มีอยู่
    if (action === 'edit_profile') {
      const updateData: any = {};
      if (fullName) updateData.full_name = fullName;
      if (agencyName !== undefined) updateData.agency_name = agencyName;
      if (phone !== undefined) updateData.phone = phone;
      if (role) updateData.role = role;
      if (status) updateData.status = status;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update password if provided
      if (password && password.trim() !== '') {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      }

      return NextResponse.json({ success: true, user: data });
    }

    // 3. ปรับสถานะหรือบทบาทอย่างรวดเร็ว
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: ลบผู้ใช้งาน (ทั้ง Auth และ Profile)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Delete Auth User
    await supabaseAdmin.auth.admin.deleteUser(userId);

    // Delete Profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
